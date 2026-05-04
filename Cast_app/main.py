import os
import json
import multiprocessing
import argparse
import time
import random
import base64
import io
import threading
import psycopg2
import segno #type: ignore # pylint: disable=import-error
from Crypto.PublicKey import ECC
from pydantic import BaseModel # pyright: ignore[reportMissingImports] # pylint: disable=import-error
import gmpy2
import threshold_crypto as tc
from uuid import uuid4
from fastapi import FastAPI  # type: ignore # pylint: disable=import-error
from fastapi import Header, HTTPException # type: ignore # pylint: disable=import-error
from threshold_crypto import CurveParameters
from curve import Curve
from VCaster import (
    VCaster,
    ECCEncoder,
)
from dotenv import load_dotenv
import uvicorn # pyright: ignore[reportMissingImports] # pylint: disable=import-error
# pylint: disable=no-member

load_dotenv("../.env")

def get_connection():
    con = psycopg2.connect(
        host="db",
        port=5432,
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
    )
    return con

app = FastAPI()




try:
    con = get_connection()
    cur = con.cursor()
    cur.execute("SELECT COUNT(*) FROM tellers")
    count = cur.fetchone()[0]
    if count == 0:
        time.sleep(3)
except Exception as e:
    print("FAILED to retrieve from tally", e, flush=True)
    

cur.execute("SELECT current_database()")
print("Connected to:", cur.fetchone()[0])


# Decodes from x, y coordinates to EccPoints
def decode_point_recursive(obj):
    """Recursively convert any {x, y} dicts back to EccPoints in nested structures"""
    if isinstance(obj, dict) and 'x' in obj and 'y' in obj:
        return ECC.EccPoint(int(obj['x']), int(obj['y']), 'P-192')
    elif isinstance(obj, dict):
        return {k: decode_point_recursive(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decode_point_recursive(item) for item in obj]
    elif isinstance(obj, (int, float)) and not isinstance(obj, bool):
        return gmpy2.mpz(obj)
    return obj

def decode_public_key(datas):
    data = json.loads(datas[0])

    curve_name = data["curve_name"]

    curve_params = CurveParameters(curve_name)

    qx = int(data["Q"]["x"])
    qy = int(data["Q"]["y"])

    Q = ECC.EccPoint(qx, qy, curve_name)

    return tc.data.PublicKey(Q, curve_params)


# Decodes the ballots as stored in the database back to Ecc objects
def decode_bb_data(row):
    bb_data = row[1] # Loads the json string of the ballot
    
    # Converts the public key back to ECC key formattign
    bb_data['spk'] = ECC.import_key(bb_data['spk'])
    
    # Takes the integers for the trapdoor keys and the sum of r back to mpz formatting
    bb_data['stk'] = gmpy2.mpz(bb_data['stk'])
    bb_data['stk_anti'] = [gmpy2.mpz(x) for x in bb_data['stk_anti']]
    bb_data['sum_r'] = gmpy2.mpz(bb_data['sum_r'])

    
    # Takes the hex formatted signature and converts it back to bytes
    bb_data['sig'] = bytes.fromhex(bb_data['sig'])
    
    # Converts x,y coordinates back to EccPoints
    def to_point(d):
        return ECC.EccPoint(int(d['x']), int(d['y']), 'P-192')
    
    # for the vote, antivote, encrypted trapdoor key, and encrypted antitrapdoor key we convert the votes back to EccPoints and the keys to mpz formatting
    for key in ['ev', 'enc_ptk']:
        bb_data[key][0] = to_point(bb_data[key][0])
        bb_data[key][1] = to_point(bb_data[key][1])
        bb_data[key][2] = gmpy2.mpz(bb_data[key][2])

    for key in ['ev_anti', 'enc_ptk_anti']:
        for x in bb_data[key]:
            x[0] = to_point(x[0])
            x[1] = to_point(x[1])
            x[2] = gmpy2.mpz(x[2])
    
    # The proofs are converted from x,y coordinates to EccPoints using the decode_point_recursive function
    for key in ['pi_1', 'pi_1_anti', 'pi_2', 'pi_3']:
        if key in bb_data:
            bb_data[key] = decode_point_recursive(bb_data[key])

    # Finally the original ballot is returned
    return bb_data



# This so Mathildes Macbook uses forks for multiprocessing instead of spawn
multiprocessing.set_start_method('fork', force=True)

parser = argparse.ArgumentParser(
    description="Sutr implementation"
)
parser.add_argument(
    "voter_count", metavar="N", type=int, help="Number of voters"
)
parser.add_argument(
    "vote_timer", metavar="N", type=int, help="Total time of election"
)

args = parser.parse_args()

num_voters = 10
if (
    args.voter_count is not None
    and int(args.voter_count) > 0
    and int(args.voter_count) < 10000000
):
    num_voters = int(args.voter_count)


vote_min = 0
vote_max = 4

t_voting_single = 0
t_verification_single = 0
t_re_enc_mix_ver = 0
t_mixing = [0] * num_voters
t_decryption = [0] * num_voters

voters = []

cur.execute("SELECT t_pk FROM tellers")
raw_keys = cur.fetchall()
teller_public_keys = [decode_public_key(row) for row in raw_keys]


curve = Curve("P-192")

election_time = int(args.vote_timer)

def election_timer(e_time):
    time.sleep(e_time)
    print("election is done", flush=True)
    shutdown()

def shutdown():
    cur.close()
    con.close()

    os._exit(0)

def poc_setup():
    """Sets up voter IDs and voter objects for 'vote_max' voters.
    Generates DSA key pairs for each voter.
    Picks a random vote value for each voter in the range
    ('vote_min':'vote_max').
    Adds all 'voter' objects to the 'voters' list.
    """

    for i in range(0, num_voters):
        id = "VT" + str(i)
        voter = VCaster(curve, id, vote_min, vote_max, cur, con)
        voter.generate_dsa_keys()
        voter.choose_vote_value()
        voters.append(voter)


'''def voting():
    """The voting phase of the protocol.
    For each 'voter' in the 'voters' list:
        a trapdoor keypair is generated,
        a proof of knowledge of the trapdoor secret key is generated,
        the vote is encrypted under the tellers' threshold public key,
        a proof of wellformedness of the ballot is generated,
        the signed, encrypted ballot is posted to a bulletin board.
    """
    for voter in voters:
        teller_public_key = get_random_tpk(teller_public_keys)
        t_voting_single_start = time.time()
        voter.generate_trapdoor_keypair()
        #Loop
        voter.generate_antitrapdoor_keypair()
        voter.encrypt_vote(teller_public_key)

        # Indsæt loop for alle andre kandidater
        voter.encrypt_antivote(teller_public_key) # encrypt other vote
        voter.encrypt_trapdoor(teller_public_key) # encrypt the trapdoor

        #Indsæt loop for all andre kandidaters trapdoors
        voter.encrypt_antitrapdoor(teller_public_key) # encrypt the other trapdoor
        voter.generate_pok_trapdoor_keypair(teller_public_key)

        # Loop for alle andre anti
        voter.generate_pok_antitrapdoor_keypair(teller_public_key)
        voter.generate_wellformedness_proof(teller_public_key)

        # Loop for beviser for alle andre kandidater
        voter.generate_wellformedness_proof_anti(teller_public_key) # proof other vote
        print("Vote has been cast for", voter.id)
        voter.sign_ballot(voter.secret_key)
        time.sleep(10)'''

def get_random_tpk(tpks):
    encoded_pk = random.choice(tpks)
    return encoded_pk


_P192_P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFF
_P192_B = 0x64210519E59C80E70FA7E9AB72243049FEB8DEECC146B9B1

def _decompress_point(x: int, prefix: int) -> int:
    p = _P192_P
    a = p - 3  # -3 mod p
    y_sq = (pow(x, 3, p) + a * x + _P192_B) % p
    y = pow(y_sq, (p + 1) // 4, p)  # works because p ≡ 3 (mod 4)
    if (y % 2 == 0) != (prefix == 0x02):
        y = p - y
    return y

def _decode_scalar(data: bytes, offset: int):
    val = int.from_bytes(data[offset:offset+24], 'big')
    return gmpy2.mpz(val), offset + 24

def _decode_ciphertext(data: bytes, offset: int):
    p0, offset = _decode_point(data, offset)
    p1, offset = _decode_point(data, offset)
    s,  offset = _decode_scalar(data, offset)
    return (p0, p1, s), offset

def _decode_proof(data: bytes, offset: int):
    s0, offset = _decode_scalar(data, offset)
    s1, offset = _decode_scalar(data, offset)
    p,  offset = _decode_point(data, offset)
    return (s0, s1, p), offset

def _decode_point(data: bytes, offset: int):
    prefix = data[offset]
    x = int.from_bytes(data[offset+1:offset+25], 'big')
    y = _decompress_point(x, prefix)
    return ECC.EccPoint(x, y, 'P-192'), offset + 25


@app.post("/trigger")
async def trigger(data: dict, x_api_key: str = Header(...)):
    '''
    trigger: endpoint that receives a vote from the API.
    Validates the SECRET_KEY in the request header to ensure ONLY the API
    can call this, rejecting any other caller with a 403.
    If authenticated, creates a VCaster with the given voter_id, assigns
    the chosen candidate (vote_value), and runs the full voting flow
    which encrypts and posts the ballot to the database.
    '''
    if x_api_key != os.getenv("API_TO_CAST_KEY"):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    qr_bytes = base64.b64decode(data["qr_data"])
    offset = 0
    encrypted_trapdoor, offset = _decode_ciphertext(qr_bytes, offset)
    encrypted_antitrapdoor = []
    for i in range(vote_max - 1):
        ct, offset = _decode_ciphertext(qr_bytes, offset)
        encrypted_antitrapdoor.append(ct)
    
    pok_trapdoor_key, offset = _decode_proof(qr_bytes, offset)
    pok_antitrapdoor_key = []
    for _ in range(vote_max - 1):
        proof, offset = _decode_proof(qr_bytes, offset)
        pok_antitrapdoor_key.append(proof)
    
    voter = VCaster.findVoter(data["id"], curve, vote_min, vote_max, cur, con)
    voter.encrypted_trapdoor = encrypted_trapdoor
    voter.encrypted_antitrapdoor = encrypted_antitrapdoor
    voter.pok_trapdoor_key = pok_trapdoor_key
    voter.pok_antitrapdoor_key = pok_antitrapdoor_key
    
    voter.generate_dsa_keys()
    pk = voter.public_key


    cur.execute("SELECT max(id) FROM registered_voters")
    temp_id = cur.fetchone()
    if (temp_id[0] is None):
        r_id = 0
    else:
        r_id = temp_id[0] + 1
        
    cur.execute(
        "INSERT INTO registered_voters (id, voterid, pk) VALUES (%s, %s, %s)", (r_id, data["id"], json.dumps(pk, cls=ECCEncoder))
    )

    con.commit()
    voter.vote = data["vote_value"]
    voter.cast_vote(get_random_tpk(teller_public_keys))
    voter.sign_ballot()

    return {"status": "ok", "voter_id": data["id"]}


threading.Thread(target=election_timer, args=(election_time,)).start()
#new thread so that the cast_app can listen for incomming requests on port 8001
threading.Thread(target=uvicorn.run, kwargs={"app": app, "host": "0.0.0.0", "port": 8001}, daemon=True).start()
poc_setup()
#voting()
