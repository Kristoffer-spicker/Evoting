import json
import gmpy2
from Crypto.PublicKey import ECC
from Encoding import ECCEncoder


def finaltripletdecoder (single_triplet):
    def to_point(d):
        return ECC.EccPoint(int(d['x']), int(d['y']), 'P-256')

    def decode_ciphertext_list(c):
        # Normalizes both dict and list formats into [point, point, mpz]
        if isinstance(c, dict):
            return [
                to_point(c['c1']),
                to_point(c['c2']),
                gmpy2.mpz(c.get('r', c.get('r_anti', 0)))
            ]
        else:
            return [
                to_point(c[0]),
                to_point(c[1]),
                gmpy2.mpz(c[2])
            ]

    return {
        "re_enc":   decode_ciphertext_list(single_triplet[0]),
        "new_com":   decode_ciphertext_list(single_triplet[1]),
        "new_key":   decode_ciphertext_list(single_triplet[2])
        
    }


def final_triplets(cur, con, tellers):
    # Retrieving the 3 elements from the newly generated tripelt witht he actual vote
    # -> 0 -> 1 is to get inside all of the outer arrays.
    cur.execute("""
        SELECT 
            ballot -> 0 -> 1 -> 'reenc'  AS re_enc,
            ballot -> 0 -> 1 -> 'enc_gy' AS new_com,
            ballot -> 0 -> 1 -> 'enc_gs' AS new_key
        FROM extended_votes
    """)
    con.commit()
    triplets = cur.fetchall()
    tripletsdecoded = []
    for trip in triplets:
        decoded = (finaltripletdecoder(trip))
        tripletsdecoded.append([
                decoded["re_enc"],
                decoded["new_com"],
                decoded["new_key"]
            ])
    
    for teller in tellers:
        result = teller.re_encryption_mix(tripletsdecoded)
        tripletsdecoded = result[0]  # list_1 is the re-encrypted triplets
        print("remix and reincryption complete", flush=True)

    mixedtrips = json.loads(json.dumps(tripletsdecoded, cls=ECCEncoder))

    for trip in mixedtrips:
        # Selects the highest id in the table
        cur.execute ( "SELECT max(id) FROM reencrypted_extend_triplets")
        id = cur.fetchone()[0]
        if (id is None):
            id = 0
            print("id is none updated to 0", flush=True)
        else: 
            id = int(id) + 1
            print("id is good :))", flush=True)
        
        cur.execute(
            "INSERT INTO reencrypted_extend_triplets (id, triplet) VALUES (%s, %s)", (id, json.dumps(trip),)
            )
    
    








