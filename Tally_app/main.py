import os
import select
import json
import sys
import multiprocessing
import psycopg2
from curve import Curve
from Tallying import Teller
from dotenv import load_dotenv
import threshold_crypto as tc
from pathlib import Path

load_dotenv("../.env")

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

try:
    con = get_listener_connection()
    cur = con.cursor()
    print("Got cursor", flush=True)
except Exception as e:
    print("FAILED TO CONNECT TO DB:", e, flush=True)
    sys.exit(1)

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

# This so Mathildes Macbook uses forks for multiprocessing instead of spawn
multiprocessing.set_start_method('fork', force=True)

num_tellers = 5
k = 3

q1 = multiprocessing.Queue()
q2 = multiprocessing.Queue()

tellers = []


teller_proofs = []

teller_sk = []
teller_public_key = ""
teller_registry = []

curve = Curve("P-256")

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
    
    


def listen():
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
    print("New ballot Received", flush=True)
    data = json.loads(notify)

    con = get_listener_connection()
    cur = con.cursor()

    cur.execute(
        "INSERT INTO extendedVotes (id, ballot) VALUES (%s, %s)",(data["id"], data["ballot"])
    )

    con.commit()
    cur.close()
    con.close()

    print(f"Inserted {data['id']} into extendedVotes", flush=True)
    


try:
    setup()
    print("Setup complete", flush=True)
except Exception as e:
    print("SETUP FAILED:", e, flush=True)
    sys.exit(1)

try:
    listen()
except Exception as e:
    print("LISTEN FAILED:", e, flush=True)
    sys.exit(1)