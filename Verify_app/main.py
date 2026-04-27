import base64
import io
import os
import random
import select
import traceback
import threading
import uvicorn # type: ignore # pylint: disable=import-error
from dotenv import load_dotenv
from fastapi import FastAPI # type: ignore # pylint: disable=import-error
import psycopg2
import threshold_crypto as tc
from threshold_crypto import CurveParameters
from pydantic import BaseModel # pyright: ignore[reportMissingImports] # pylint: disable=import-error
import json
from Crypto.PublicKey import ECC
from qr_backend import qr_data
from curve import Curve
from uuid import uuid4
import segno #type: ignore # pylint: disable=import-error
import gmpy2
from VVerify import VVerify


# pylint: disable=no-member

load_dotenv("../.env")
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

app = FastAPI()

cur.execute("SELECT t_pk FROM tellers")
raw_keys = cur.fetchall()
teller_public_keys = [decode_public_key(row) for row in raw_keys]

curve = Curve("P-192")
vote_max = 4

g_vote_store = {}  # in-memory store
g_ri_store = {}

class GVoteRequest(BaseModel):
    voter_id: str
    g_vote_x: str
    g_vote_y: str
    curve: str

class QRRequest(BaseModel):
    id: str

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



def reencrypted_extend_triplets_listen():
    """
    Listen to the extended_votes table 
    Starts by connecting to the server
    Then runs a while true loop that checks the table continuously
    """
    conn = get_connection()
    conn.autocommit = True 
    cur = conn.cursor()
    cur.execute("LISTEN reencrypted_extend_triplets;")
    print("Listening on reencrypted_extend_triplets", flush=True)
    while True:
        if select.select([conn], [], [], 5) == ([], [], []):
            continue
        else:
            conn.poll()
            while conn.notifies:
                notify = conn.notifies.pop(0)
                reencrypted_extend_triplets_handler(notify.payload, conn)


def reencrypted_extend_triplets_handler(notify, con):
    try:
        cur = con.cursor()
        for voter_id, g_vote in g_vote_store.items():
            if voter_id not in g_ri_store:
                print(f"No g_ri for voter {voter_id}, skipping", flush=True)
                continue
            
            verifier = VVerify(
                curve=curve,
                id=voter_id,
                vote_min=0,
                vote_max=vote_max,
                cur=cur,
                con=con
            )
            verifier.g_ri = g_ri_store[voter_id]
            verifier.g_vote = g_vote
            verifier.verifyVote(verifier, cur, g_vote)
            print(f"Vote verified for voter {voter_id}", flush=True)
    except Exception as e:
        print("Error in handler: " + str(e), flush=True)
        traceback.print_exc()

    


listener_thread = threading.Thread(target=reencrypted_extend_triplets_listen, daemon=True)
listener_thread.start()

@app.post("/receive_g_vote")
def receive_g_vote(request: GVoteRequest):
    g_vote_store[request.voter_id] = ECC.EccPoint(
        int(request.g_vote_x), int(request.g_vote_y), request.curve
    )
    return {"status": "ok"}

uvicorn.run(app, host="0.0.0.0", port=8002)