#!/usr/bin/env python3
"""
Benchmark script: creates voters and casts votes entirely in the backend,
bypassing the QR code flow. Use this to test tallying time with a candidate
count that exceeds what a QR code can hold.

Usage:
    python3 test_cast.py <num_voters> <num_candidates> [--seed-candidates]

    --seed-candidates   Replaces the candidates table with <num_candidates>
                        entries before casting. Omit if already seeded.
"""

"""
To run this start the tallying servers and database normally:
    docker compose -f compose.persis.yaml up -d

Then run this script:
    docker compose run --rm --no-deps cast_app python3 test_cast.py 1 10 --seed-candidates

To test with more candidates, remember to update the amount in compose.persis.yaml also
"""

import sys
import os
import json
import random
import argparse
import time
import psycopg2
from dotenv import load_dotenv
from Crypto.PublicKey import ECC
import threshold_crypto as tc
from threshold_crypto import CurveParameters
import gmpy2

from curve import Curve
from VCaster import VCaster, ECCEncoder
from primitives import ElGamalEncryption, ChaumPedersenProof

load_dotenv("../.env")


def get_connection():
    return psycopg2.connect(
        host="db",
        port=5432,
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
    )


def decode_public_key(row):
    data = json.loads(row[0])
    curve_params = CurveParameters(data["curve_name"])
    Q = ECC.EccPoint(int(data["Q"]["x"]), int(data["Q"]["y"]), data["curve_name"])
    return tc.data.PublicKey(Q, curve_params)


def generate_trapdoor_data(curve, teller_public_key, vote_max):
    """Generate trapdoor/antitrapdoor keys and proofs (normally encoded in QR code)."""
    ege = ElGamalEncryption(curve)
    chmp = ChaumPedersenProof(curve)

    secret_tk, public_tk = ege.keygen()
    enc_td = ege.encrypt(teller_public_key.Q, public_tk)
    pok_td = chmp.prove(
        {"c1": enc_td[0], "c2": enc_td[1]},
        enc_td[2],
        teller_public_key.Q,
        public_tk,
    )

    enc_atd_list = []
    pok_atd_list = []
    for _ in range(vote_max - 1):
        _, public_atk = ege.keygen()
        enc_atd = ege.encrypt(teller_public_key.Q, public_atk)
        enc_atd_list.append(enc_atd)
        pok_atd_list.append(chmp.prove(
            {"c1": enc_atd[0], "c2": enc_atd[1]},
            enc_atd[2],
            teller_public_key.Q,
            public_atk,
        ))

    return enc_td, enc_atd_list, pok_td, pok_atd_list


def seed_candidates(curve, cur, con, num_candidates):
    for i in range(num_candidates):
        curve_p = curve.raise_p(i)
        cur.execute(
            "INSERT INTO candidates VALUES (%s, %s) ON CONFLICT (id) DO NOTHING",
            (i, json.dumps(curve_p, cls=ECCEncoder)),
        )
    con.commit()
    print(f"Seeded {num_candidates} candidates.", flush=True)


def main():
    parser = argparse.ArgumentParser(description="Cast test votes directly in the backend.")
    parser.add_argument("num_voters", type=int, help="Number of voters to simulate")
    parser.add_argument("num_candidates", type=int, help="Number of candidates (vote range)")
    parser.add_argument(
        "--seed-candidates", action="store_true",
        help="Replace candidates table with num_candidates entries before casting",
    )
    args = parser.parse_args()

    vote_min = 0
    vote_max = args.num_candidates

    con = get_connection()
    cur = con.cursor()

    curve = Curve("P-192")

    if args.seed_candidates:
        seed_candidates(curve, cur, con, vote_max)

    cur.execute("SELECT t_pk FROM tellers")
    raw_keys = cur.fetchall()
    if not raw_keys:
        print("No tellers found in the database. Has the system been set up?", flush=True)
        sys.exit(1)
    teller_public_keys = [decode_public_key(row) for row in raw_keys]

    cur.execute("SELECT MAX(id) FROM registered_voters")
    temp = cur.fetchone()
    next_r_id = 0 if temp[0] is None else temp[0] + 1

    for i in range(args.num_voters):
        voter_id = f"TEST_{i}"
        tpk = random.choice(teller_public_keys)

        voter = VCaster(curve, voter_id, vote_min, vote_max, cur, con)
        voter.generate_dsa_keys()
        voter.vote = random.randrange(vote_min, vote_max)

        (voter.encrypted_trapdoor,
         voter.encrypted_antitrapdoor,
         voter.pok_trapdoor_key,
         voter.pok_antitrapdoor_key) = generate_trapdoor_data(curve, tpk, vote_max)

        voter.cast_vote(tpk)

        cur.execute(
            "INSERT INTO registered_voters (id, voterid, pk) VALUES (%s, %s, %s)",
            (next_r_id + i, voter_id, json.dumps(voter.public_key, cls=ECCEncoder)),
        )

        voter.sign_ballot()
        print(f"[{i + 1}/{args.num_voters}] {voter_id} voted for candidate {voter.vote}", flush=True)
        if i < args.num_voters - 1:
            time.sleep(2)

    cur.close()
    con.close()
    print(f"\nDone: {args.num_voters} votes cast with {vote_max} candidates.", flush=True)


if __name__ == "__main__":
    main()
