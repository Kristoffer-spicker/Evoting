import os
import select
import json
import sys
import multiprocessing
import threading
import time
import argparse
import psycopg2
from curve import Curve
from Tallying import Teller
from dotenv import load_dotenv
import threshold_crypto as tc
from extend_handling import handler
from triplet_handling import extend_handler


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



parser = argparse.ArgumentParser(
    description="Sutr implementation"
)

parser.add_argument(
    "election_time", metavar="N", type=int, help="Time for casting"
)
parser.add_argument(
    "number_of_tellers", metavar="N", type=int, help="The total number of tellers for the election"
)
parser.add_argument(
    "k", metavar="N", type=int, help="Threshold for number of correctly running tellers"
)
args = parser.parse_args()

# This is so Mathildes Macbook uses forks for multiprocessing instead of spawn
multiprocessing.set_start_method('fork', force=True)

num_tellers = args.number_of_tellers
k = args.k

voting_phase_timer = args.election_time

def start_decrypt(e_timer):
    time.sleep(e_timer)
    print("voting phase has ended", flush=True)
    

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
                handler(notify.payload, get_listener_connection(), tellers)


def extended_listen():
    """
    Listen to the extended_votes table 
    Starts by connecting to the server
    Then runs a while true loop that checks the table continuously
    """
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
                extend_handler(notify.payload, conn, tellers)

try:
    setup()
    print("Setup complete", flush=True)
except Exception as e:
    print("SETUP FAILED:", e, flush=True)
    sys.exit(1)


# THEN start threads
threading.Thread(target=start_decrypt, args=(voting_phase_timer,)).start()
t1 = threading.Thread(target=encrypted_listen)
t2 = threading.Thread(target=extended_listen)
t1.start()
t2.start()
t1.join()
t2.join()