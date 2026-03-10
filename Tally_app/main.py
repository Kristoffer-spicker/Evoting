import psycopg2
import os
import asyncio
import multiprocessing
from curve import Curve
from Tallying import Teller
from dotenv import load_dotenv
import json
import threshold_crypto as tc
from Crypto.PublicKey import ECC

load_dotenv("../.env")


con = psycopg2.connect(
    host="localhost",
    port=5433,
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
)
cur = con.cursor()

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
        curve_param = {
            "curve_name": obj.curve_params._name,
            "order": int(obj.curve_params._curve.order),
            "generator_point": {
                "x": str(obj.curve_params._curve.Gx),
                "y": str(obj.curve_params._curve.Gy),
            }
        }
        return {
            "Q": {
                "x": str(obj.Q.x),
                "y": str(obj.Q.y),
            },
            "curve_param": curve_param
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
    
    


"""async def listen():
    conn = await con 
    await conn.add_listener('encryptedVotes', handler)
    

def handler(connection, vid, channel, ballot):
    print ("new ballot:", ballot)

asyncio.run(listen())"""

setup()
#listen()