import os
import select
import json
import sys
import multiprocessing
import psycopg2
import threading
from curve import Curve
from Tallying import Teller
from dotenv import load_dotenv
import threshold_crypto as tc
from Decoding import decode_bb_data
from Decoding import decode_extended_ballot
from Encoding import ECCEncoder
from util import deserialize_ep
import traceback

load_dotenv("../.env")

# Makes the connection to our database in the docker container
def get_listener_connection():
    con = psycopg2.connect(
        host="db",
        port=5432,
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
    )
    con.autocommit = True  # Required for LISTEN to work
    print("Connected!", flush=True)
    return con

#Calls the listener in try catch to establish connection to DB
try:
    con = get_listener_connection()
    cur = con.cursor()
    print("Got cursor", flush=True)
except Exception as e:
    print("FAILED TO CONNECT TO DB:", e, flush=True)
    sys.exit(1)

# Find and deletes the contents of the tellers table when started
cur.execute("""
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'tellers'    
    )
""")
if cur.fetchone()[0]:
    cur.execute("DELETE FROM tellers")
    con.commit()

# Removes all extended votes at start time
cur.execute("DELETE FROM extended_votes")
con.commit()

# This is so Mathildes Macbook uses forks for multiprocessing instead of spawn
multiprocessing.set_start_method('fork', force=True)

num_tellers = 5
k = 3

tellers = []

teller_proofs = []

teller_sk = []
teller_public_key = ""
teller_registry = []

curve = Curve("P-256")

# Converts a public key to dict formatting
def custom_serializer(obj):
    if isinstance(obj, tc.data.PublicKey):
        return {
            "Q": {
                "x": str(obj.Q.x),
                "y": str(obj.Q.y),
            },
            "curve_name": obj.curve_params._name
        }
    raise TypeError("Object of type '{}' is not serializable".format(type(obj).__name__))

def setup():
    """The setup phase of the protocol.
    Sets up 'num_tellers' teller objects.
    The teller public key and the threshold secret keys for
    'num_tellers' tally tellers are established.
    Adds all 'teller' objects to the 'tellers' list.
    """
    global teller_public_key
    global teller_sk
    global teller_id
    teller_public_key, teller_sk = Teller.generate_threshold_keys(
        k, num_tellers, curve.get_pars()
    )
    
    for i in range(0, num_tellers):
        teller_id = i
        teller = Teller(curve, teller_sk[i], teller_public_key)
        tellers.append(teller)
        t_pk = json.dumps(teller_public_key, default=custom_serializer)
        cur.execute("INSERT INTO tellers VALUES (%s, %s)", (teller_id,t_pk))
        con.commit()
    
    


def encrypted_listen():
    """
    Setups the listener for the encryptedvotes table
    Starts by connecting to the server
    Then runs a while true loop that checks the table continuously
    """
    conn = get_listener_connection()
    cur = conn.cursor()
    print("About to issue LISTEN", flush=True)
    cur.execute("LISTEN encrypted_votes;")
    print("Listening on encrypted_votes", flush=True)
    while True:
        if select.select([conn], [], [], 5) == ([], [], []):
            print("still waiting...",flush=True)
        else:
            print("socket became readable", flush=True)
            conn.poll()
            while conn.notifies:
                notify = conn.notifies.pop(0)
                handler(notify.payload)

        

def handler(notify):
    """
    The function called when a new vote is found in the table
    Takes a encrypted vote decodes, extends and encodes it
    Finally the extended and encoded vote is added to the extended_votes table
    """
    print("New ballot Received", flush=True)
    con = get_listener_connection()
    cur = con.cursor()
    cur.execute("SELECT ballot FROM encrypted_votes WHERE id = %s", (notify,))
    ballot = cur.fetchone()[0]

    extended_ballot = extend_and_encode_vote(ballot)
    parsed = json.loads(extended_ballot)

    cur.execute(
        "INSERT INTO extended_votes (id, ballot) VALUES (%s, %s) ON CONFLICT (id) DO UPDATE SET ballot = EXCLUDED.ballot", (parsed["id"], json.dumps(parsed["ballot"]))
    )

    con.commit()
    cur.close()
    con.close()

    
def extend_and_encode_vote(row):
    """
    Takes an encoded vote 
    The vote is then decoded
    Then the decoded vote is run through the mp_raise_h function which extends the vote this is done with multiprocessing
    Lastly it builts the final extended vote and finally encoded via the custom encoder from the encoding class
    """
    try:
        decoded = decode_bb_data(row)

        current_list = [[decoded["id"], decoded]]
        combined_outputs = []

            
        for teller in tellers:
            q1 = multiprocessing.Queue()
            q2 = multiprocessing.Queue()
            q3 = multiprocessing.Queue()
            print("started queues", flush=True)
            p = multiprocessing.Process(
                target = teller.mp_raise_h, args=(current_list, q1, q2, q3)
            )
            p.start()
            try:
                print(f"[PARENT] waiting for q1.get()", flush=True)
                _ = json.loads(q1.get())
                print(f"[PARENT] waiting for q2.get()", flush=True)
                _ = json.loads(q2.get())
                print(f"[PARENT] waiting for q3.get()", flush=True)
                combined_outputs.append(json.loads(q3.get()))
                print(f"[PARENT] got from q3.get()", flush=True)
            except Exception as e:
                print(f"[PARENT] ERROR getting queue: {e}", flush=True)
                
            
            p.join()

       
        raised = []
        for i in range(len(combined_outputs[0])):
            ballot = combined_outputs[0][i][1]
            prod_a = deserialize_ep(ballot["h_r"]["c1"])
            prod_b = deserialize_ep(ballot["h_r"]["c2"])
            prod_a_anti = []
            prod_b_anti = []
            for k in range(len(ballot["h_r_anti"])):
                prod_a_anti.append(deserialize_ep(ballot["h_r_anti"][k]["c1"]))
                prod_b_anti.append(deserialize_ep(ballot["h_r_anti"][k]["c2"]))
            sum_r = ballot["h_r"]["r"]
            
            sum_r_anti = []
            for l in range(len(ballot["h_r_anti"])):
                sum_r_anti.append(ballot["h_r_anti"][l]["r_anti"])

            for j in range(1, len(combined_outputs)):
                b = combined_outputs[j][i][1]
                prod_a = prod_a + deserialize_ep(b["h_r"]["c1"])
                prod_b = prod_b + deserialize_ep(b["h_r"]["c2"])
                sum_r = sum_r + b["h_r"]["r"]
                for m in range (len(b["h_r_anti"])):
                    prod_a_anti[m] = prod_a_anti[m] + deserialize_ep(b["h_r_anti"][m]["c1"])
                    prod_b_anti[m] = prod_b_anti[m] + deserialize_ep(b["h_r_anti"][m]["c2"])
                for n in range (len(b["h_r_anti"])):
                    sum_r_anti[n] = sum_r_anti[n] + b["h_r_anti"][n]["r_anti"]

            ballot["h_r"] = {"c1": prod_a, "c2": prod_b, "r": sum_r}
            ballot["h_r_anti"] = [
                {"c1": prod_a_anti[o], "c2": prod_b_anti[o], "r_anti": sum_r_anti[o]}
                for o in range(len(prod_a_anti))
            ]
            raised.append([combined_outputs[0][i][0], ballot])

        extended_ballot = {"id": decoded["id"], "ballot": raised}
        encoded_ballot = json.dumps(extended_ballot, cls=ECCEncoder)
        return encoded_ballot
    except Exception as e:
        print("extend_and_encode_vote FAILED:", e, flush=True)
        traceback.print_exc()
        raise


def extended_listen():
    conn = get_listener_connection()
    cur = conn.cursor()
    cur.execute("LISTEN extended_votes;")
    print("Listening on extended_votes", flush=True)
    while True:
        if select.select([conn], [], [], 5) == ([], [], []):
            continue
        else:
            conn.poll()
            while conn.notifies:
                notify = conn.notifies.pop(0)
                extend_handler(notify.payload)

def extend_handler(notify):
    data = notify
    con = get_listener_connection()
    cur = con.cursor()
    cur.execute("SELECT ballot from extended_votes WHERE id = %s", (data,))
    ballot = cur.fetchone()[0]

    triplets = reencryptTriplets(ballot)
    parsed = json.loads(triplets)

    cur.execute(
        "INSERT INTO reencrypted_triplets (triplet) VALUES (%s)", (json.dumps(parsed),)
    )

    con.commit()
    cur.close()
    con.close()



def reencryptTriplets(ballot):
    decoded_list = json.loads(ballot) if isinstance(ballot, str) else ballot

    triplets = []

    for ballot_id, single_ballot in decoded_list:
        decoded = decode_extended_ballot(single_ballot)  # ← use new decoder

        triplets.append([decoded["ev"], decoded["h_r"], decoded["enc_gr"]])

        for i in range(len(decoded["ev_anti"])):
            triplets.append([
                decoded["ev_anti"][i],
                decoded["h_r_anti"][i],
                decoded["enc_gr"]
            ])

    for teller in tellers:
        result = teller.re_encryption_mix(triplets)
        triplets = result[0]  # list_1 is the re-encrypted triplets

    return json.dumps(triplets, cls=ECCEncoder)

try:
    setup()
    print("Setup complete", flush=True)
except Exception as e:
    print("SETUP FAILED:", e, flush=True)
    sys.exit(1)



# THEN start threads
t1 = threading.Thread(target=encrypted_listen)
t2 = threading.Thread(target=extended_listen)
t1.start()
t2.start()
t1.join()
t2.join()
