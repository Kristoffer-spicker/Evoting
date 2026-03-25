import os
import json
import multiprocessing
import argparse
import time
import random
import psycopg2
from Crypto.PublicKey import ECC
import gmpy2
import threshold_crypto as tc
from threshold_crypto import CurveParameters
from curve import Curve
from VCaster import VCaster
from dotenv import load_dotenv
# pylint: disable=no-member

load_dotenv("../.env")


con = psycopg2.connect(
    host="db",
    port=5432,
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
)
cur = con.cursor()

cur.execute("SELECT current_database()")
print("Connected to:", cur.fetchone()[0])

# Starts each run by clearing the database
cur.execute("""
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'encrypted_votes'
    )
""")

if cur.fetchone()[0]:
    cur.execute("DELETE FROM encrypted_votes")
    con.commit()

# Decodes from x, y coordinates to EccPoints
def decode_point_recursive(obj):
    """Recursively convert any {x, y} dicts back to EccPoints in nested structures"""
    if isinstance(obj, dict) and 'x' in obj and 'y' in obj:
        return ECC.EccPoint(int(obj['x']), int(obj['y']), 'P-256')
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
    bb_data = json.loads(row[1]) # Loads the json string of the ballot
    
    # Converts the public key back to ECC key formattign
    bb_data['spk'] = ECC.import_key(bb_data['spk'])
    
    # Takes the integers for the trapdoor keys and the sum of r back to mpz formatting
    bb_data['stk'] = gmpy2.mpz(bb_data['stk'])
    #bb_data['stk_anti'] = gmpy2.mpz(bb_data['stk_anti'])
    bb_data['sum_r'] = gmpy2.mpz(bb_data['sum_r'])

    for key in ['stk_anti']:
        for x in bb_data[key]:
            x = gmpy2.mpz(x)
    
    
    # Takes the hex formatted signature and converts it back to bytes
    bb_data['sig'] = bytes.fromhex(bb_data['sig'])
    
    # Converts x,y coordinates back to EccPoints
    def to_point(d):
        return ECC.EccPoint(int(d['x']), int(d['y']), 'P-256')
    
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

args = parser.parse_args()

num_voters = 3
if (
    args.voter_count is not None
    and int(args.voter_count) > 0
    and int(args.voter_count) < 10000000
):
    num_voters = int(args.voter_count)


vote_min = 0
vote_max = 3

t_voting_single = 0
t_verification_single = 0
t_re_enc_mix_ver = 0
t_mixing = [0] * num_voters
t_decryption = [0] * num_voters


voters = []

bb = []
cur.execute("SELECT t_pk FROM tellers")
raw_keys = cur.fetchall()
teller_public_keys = [decode_public_key(row) for row in raw_keys]


curve = Curve("P-256")


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


def voting():
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
        voter.sign_ballot()

        bb_data = retrieve_ballot(voter.id)
        print("Vote has been cast for", voter.id)

        bb.append(bb_data)
        time.sleep(10)

# Returns the ballot cast by a voter by their id
def retrieve_ballot(id):
    cur.execute("SELECT * FROM encrypted_votes WHERE id = %s", (id,))
    ballot = cur.fetchone()
    print(type(ballot))
    return decode_bb_data(ballot)

def get_random_tpk(tpks):
    encoded_pk = random.choice(tpks)
    return encoded_pk

poc_setup()
voting()
