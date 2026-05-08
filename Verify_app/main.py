import base64
import io
import os
import random
import json
import select
import sys
import uvicorn # type: ignore # pylint: disable=import-error
from dotenv import load_dotenv
from fastapi import FastAPI # type: ignore # pylint: disable=import-error
from fastapi import Header, HTTPException # type: ignore # pylint: disable=import-error
import psycopg2
import threshold_crypto as tc
from threshold_crypto import CurveParameters
from pydantic import BaseModel # pyright: ignore[reportMissingImports] # pylint: disable=import-error
from Crypto.PublicKey import ECC
from qr_backend import qr_data
import threading
from curve import Curve
import segno #type: ignore # pylint: disable=import-error
import gmpy2
from VVerify import VVerify


# pylint: disable=no-member

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
class ECCEncoder(json.JSONEncoder): #JSONEncoder is a class from the json module that is used to convert python objects to JSON formatting.

    def default(self, obj):
        if isinstance(obj, ECC.EccKey): # For the part of the object that is a EccKey and exports it in a PEM format, which is another format for storing keys 
            return obj.export_key(format='PEM')
        if isinstance(obj, ECC.EccPoint): # EccPoints are converted to a standard coordinate format with its x and y coordinates
            return {"x": str(obj.x), "y": str(obj.y), "curve_name": obj.curve} 
        if isinstance(obj, bytes): # Objects of the type bytes are converted to their hex codes
            return obj.hex()
        if isinstance(obj, gmpy2.mpz): # Objects of the type mpz are converted to integers
            return int(obj)
        return super().default(obj) # Returns the default value of the object

def get_connection():
    con = psycopg2.connect(
        host="db",
        port=5432,
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
    )
    return con
try:
    con = get_connection()
    con.autocommit = True
    cur = con.cursor()
except Exception as e:
    print("FAILED to retrieve from tally", e, flush=True)

def decode_public_key(datas):
    data = json.loads(datas[0])

    curve_name = data["curve_name"]

    curve_params = CurveParameters(curve_name)

    qx = int(data["Q"]["x"])
    qy = int(data["Q"]["y"])

    Q = ECC.EccPoint(qx, qy, curve_name)

    return tc.data.PublicKey(Q, curve_params)

def decode_curve_point(point):
    x = int(point["x"])
    y = int(point["y"])
    curve_name = point.get("curve_name") or point.get("curve")
    return ECC.EccPoint(x, y, curve_name)


app = FastAPI()

cur.execute("SELECT t_pk FROM tellers")
raw_keys = cur.fetchall()
teller_public_keys = [decode_public_key(row) for row in raw_keys]

curve = Curve("P-192")
vote_max = 4

g_vote_store = {}  # in-memory store
#g_ri_store = {}

class GVoteRequest(BaseModel):
    voter_id: str
    g_vote_x: str
    g_vote_y: str
    curve: str

class QRRequest(BaseModel):
    id: str

class verifyrequest(BaseModel):
    voterid: str

def _encode_point(point) -> bytes:
    x = int(point.x)
    y = int(point.y)
    prefix = 0x02 if y % 2 == 0 else 0x03
    return bytes([prefix]) + x.to_bytes(24, 'big')

def _encode_scalar(scalar) -> bytes:
    return int(scalar).to_bytes(24, 'big')

def _encode_ciphertext(ct) -> bytes:
    return _encode_point(ct[0]) + _encode_point(ct[1]) + _encode_scalar(ct[2])

def _encode_proof(proof) -> bytes:
    return _encode_scalar(proof[0]) + _encode_scalar(proof[1]) + _encode_point(proof[2])

def get_random_tpk(tpks):
    encoded_pk = random.choice(tpks)
    return encoded_pk

def QR_content(id) -> bytes:
    voter = qr_data(curve, id, vote_max)
    voter.generate_trapdoor_keypair()
    voter.generate_antitrapdoor_keypair()

    secret = voter.get_trapdoor_key()

    encoded = json.dumps(secret, cls=ECCEncoder)
    true_identifier = random.choice(VVerify.identifiers)
    cur.execute(
        "INSERT INTO voter_keys (id, sk, true_identifier) VALUES (%s, %s, %s) ON CONFLICT (id) DO NOTHING",
        (id, encoded, true_identifier)
    )

    tpk = get_random_tpk(teller_public_keys)
    voter.encrypt_trapdoor(tpk)
    voter.encrypt_antitrapdoor(tpk)
    voter.generate_pok_trapdoor_keypair(tpk)
    voter.generate_pok_antitrapdoor_keypair(tpk)
    
    buf = bytearray()
    buf += _encode_ciphertext(voter.encrypted_trapdoor)
    for ct in voter.encrypted_antitrapdoor:
        buf += _encode_ciphertext(ct)
    buf += _encode_proof(voter.pok_trapdoor_key)
    for proof in voter.pok_antitrapdoor_key:
        buf += _encode_proof(proof)
    return bytes(buf)   


@app.post("/qrcodegen")
def make_QR_code(request: QRRequest):
    content = base64.b64encode(QR_content(request.id)).decode('ascii')
    qr = segno.make_qr(content)

    buffer = io.BytesIO()
    qr.save(buffer, kind="png", scale=5)
    png_bytes = buffer.getvalue()

    encoded = base64.b64encode(png_bytes).decode("utf-8")

    return {"status": "ok", "qr_code": encoded}

def decrypted_triplets_listen():
    """
    Listen to the decrypted_triplets table 
    Starts by connecting to the server
    Then runs a while true loop that checks the table continuously
    """
    conn = get_listener_connection()
    cur = conn.cursor()
    cur.execute("LISTEN decrypted_triplets ;")
    print("Listening on decrypted_triplets ", flush=True)
    verifier = VVerify(
            curve=curve,
            id=None,
            vote_min=0,
            vote_max=vote_max,
            cur=cur,
            con=con
        )
    while True:
        if select.select([conn], [], [], 5) == ([], [], []):
            continue
        else:
            conn.poll()
            while conn.notifies:
                notify = conn.notifies.pop(0)
                triplet_id = int(notify.payload)
                triplet_start = (triplet_id // vote_max) * vote_max
                verifier.verifyVote(cur, triplet_start)

@app.post("/get_election_result")
async def get_election_result(x_api_key: str = Header(...)):
    if x_api_key != os.getenv("API_TO_VERIFY_KEY"):
        raise HTTPException(status_code=403, detail="Forbidden")
    cur.execute("SELECT candidate_id, vote_count FROM final_tally")
    result = cur.fetchall()
    if result is None:
        return []
    return result


@app.post("/voter_true_identifier")
async def voter_true_identifier(request: QRRequest, x_api_key: str = Header(...)):
    if x_api_key != os.getenv("API_TO_VERIFY_KEY"):
        raise HTTPException(status_code=403, detail="Forbidden")
    cur.execute("SELECT true_identifier FROM voter_keys WHERE id = %s", (request.id,))
    row = cur.fetchone()
    if row is None or row[0] is None:
        return None
    return row[0]


@app.post("/get_true_identifier")
async def verify(request: verifyrequest, x_api_key: str = Header(...)):
    if x_api_key != os.getenv("API_TO_VERIFY_KEY"):
        raise HTTPException(status_code=403, detail="Forbidden")
    voterid = request.voterid
    cur.execute("SELECT id FROM registered_voters WHERE voterid = %s", (voterid,))
    v_id = cur.fetchone()
    v_id = v_id[0]

    verifier = VVerify(
                curve=curve,
                id=voterid,
                vote_min=0,
                vote_max=vote_max,
                cur=cur,
                con=con
            )
    

    triplet_start = v_id * vote_max
    print(f"v_id={v_id}, querying triplet IDs {triplet_start} to {triplet_start + vote_max - 1}", flush=True)

    cur.execute("SELECT triplet->'dkey' FROM decrypted_triplets WHERE id = %s", (triplet_start,))
    raw = cur.fetchone()
    if raw is None:
        print("Tallying not done yet — triplets not found", flush=True)
        return False
    dkey = decode_curve_point(raw[0])
    return verifier.get_true_identifier(dkey, triplet_start, cur)
        

@app.post("/get_identifiers")
async def getIdentifiers(request: verifyrequest, x_api_key: str = Header(...)):
    if x_api_key != os.getenv("API_TO_VERIFY_KEY"):
        raise HTTPException(status_code=403, detail="Forbidden")
    voterid = request.voterid
    cur.execute("SELECT id FROM registered_voters WHERE voterid = %s", (voterid,))
    v_id = cur.fetchone()
    v_id = v_id[0]
    identifiers = []
    triplet_start = v_id * vote_max
    for i in range (triplet_start, triplet_start + vote_max):
        cur.execute("SELECT identifier, triplet -> 'v' FROM triplets_with_identifiers WHERE id = %s", (i,))
        temp = cur.fetchone()
        curve = json.dumps(decode_curve_point(temp[1]), cls=ECCEncoder)
        cur.execute("SELECT id FROM candidates WHERE curve_p = %s", (curve,))
        tempc = cur.fetchone()
        temp = (i, temp[0], tempc[0])
        print ("temp", temp[0], temp[1], temp[2], flush=True)
        if temp is None:
            print("Tallying not done yet — triplets not found", flush=True)
            return False
        identifiers.append(temp)
    return identifiers


threading.Thread(target=decrypted_triplets_listen).start()
threading.Thread(target=uvicorn.run, kwargs={"app": app, "host": "0.0.0.0", "port": 8002}, daemon=True).start()

