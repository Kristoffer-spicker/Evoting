import json
import gmpy2
import time
import multiprocessing
from Crypto.PublicKey import ECC
from Encoding import ECCEncoder

# pylint: disable=no-member

def finaltripletdecoder(single_triplet):
    def to_point(d):
        return ECC.EccPoint(int(d['x']), int(d['y']), 'P-192')

    def decode_ciphertext_list(c):
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
        "re_enc":  decode_ciphertext_list(single_triplet[0]),
        "new_com": decode_ciphertext_list(single_triplet[1]),
        "new_key": decode_ciphertext_list(single_triplet[2]),
    }


def final_triplets(cur, con, tellers):
    cur.execute("""
        SELECT
            ballot -> 0 -> 1 -> 'reenc'  AS re_enc,
            ballot -> 0 -> 1 -> 'enc_gy' AS new_com,
            ballot -> 0 -> 1 -> 'enc_gs' AS new_key
        FROM extended_votes
    """)
    con.commit()
    triplets = cur.fetchall()
    if not triplets:
        print("final_triplets: no extended votes yet, skipping", flush=True)
        return

    tripletsdecoded = []
    for trip in triplets:
        decoded = finaltripletdecoder(trip)
        tripletsdecoded.append([decoded["re_enc"], decoded["new_com"], decoded["new_key"]])

    for teller_idx, teller in enumerate(tellers):
        triplets_json = json.dumps(tripletsdecoded, cls=ECCEncoder)
        cur.execute(
            "INSERT INTO mix_inputs (phase, teller_id, ballot_id, input_list) VALUES (%s, %s, %s, %s)",
            ("final_reenc", teller_idx, None, triplets_json),
        )
        result_json = teller.call_reencrypt_mix(triplets_json)
        result = json.loads(result_json)
        tripletsdecoded = result[0]
        cur.execute(
            "INSERT INTO mix_proofs (phase, teller_id, ballot_id, proof) VALUES (%s, %s, %s, %s)",
            ("final_reenc", teller_idx, None, result_json),
        )
        print("remix and reencryption complete", flush=True)

    mixedtrips = json.loads(json.dumps(tripletsdecoded, cls=ECCEncoder))

    for trip in mixedtrips:
        cur.execute("SELECT max(id) FROM reencrypted_extend_triplets")
        id = cur.fetchone()[0]
        id = 0 if id is None else int(id) + 1

        structured_trip = {
            "comm": trip[1],
            "v":    trip[0],
            "key":  trip[2],
        }
        cur.execute(
            "INSERT INTO reencrypted_extend_triplets (id, triplet) VALUES (%s, %s)",
            (id, json.dumps(structured_trip)),
        )
        con.commit()

    triplet_decryption(mixedtrips, tellers, cur)
    candidate_tallying(decrypted, cur)
    con.commit()


def candidate_tallying(decrypted_trips, cur):
    cur.execute("SELECT MAX(id) FROM candidates")
    num_candidates = cur.fetchone()[0]

    final_result = [0] * (num_candidates + 1)
    for trip in decrypted_trips:
        raw = trip["v"]
        normalized = {
            "x": str(raw["x"]),
            "y": str(raw["y"]),
            "curve_name": raw.get("curve_name") or raw.get("curve"),
        }
        cur.execute(
            "SELECT id FROM candidates WHERE curve_p = %s::jsonb",
            (json.dumps(normalized),),
        )
        candidate = cur.fetchone()
        if not candidate:
            print(f"No candidate found for vote: {normalized}", flush=True)
            continue
        final_result[candidate[0]] += 1

    for i in range(num_candidates + 1):
        cur.execute(
            "INSERT INTO final_tally (candidate_id, vote_count) VALUES (%s, %s)",
            (i, final_result[i]),
        )

    cur.execute("""
        SELECT c.id, c.curve_p, ft.vote_count
        FROM final_tally ft
        JOIN candidates c ON c.id = ft.candidate_id::int
        ORDER BY ft.vote_count DESC
    """)
    results = cur.fetchall()
    print("\n=== Final Tally ===", flush=True)
    for row in results:
        print(f"  Candidate {row[0]} | Votes: {row[2]} | Point: {row[1]}", flush=True)
    print("==================\n", flush=True)


def triplet_decryption(triplets, tellers, cur):
    time_now = time.time()

    tagged_ciphertexts = tellers[1].tag_ciphertexts(triplets)
    n_cpu = multiprocessing.cpu_count()
    split_ciphertexts = tellers[1].ciphertext_list_split(tagged_ciphertexts, n_cpu)
    tagged_json = json.dumps(tagged_ciphertexts, cls=ECCEncoder)

    compound_pd, compound_pd2, compound_pd3 = [], [], []

    for teller_idx, teller in enumerate(tellers):
        res = teller.call_partial_decrypt(tagged_json, n_cpu)

        cur.execute(
            "INSERT INTO decryption_proofs (phase, teller_id, proof) VALUES (%s, %s, %s) RETURNING id",
            ("final_decrypt", teller_idx, json.dumps(res["proofs"], cls=ECCEncoder)),
        )
        proof_row_id = cur.fetchone()[0]

        for batch_idx, (batch_ciph, batch_pd, batch_pd2, batch_pd3) in enumerate(
            zip(split_ciphertexts, res["per_batch_pd"], res["per_batch_pd2"], res["per_batch_pd3"])
        ):
            if not batch_ciph:
                continue
            cur.execute(
                "INSERT INTO decryption_inputs "
                "(phase, teller_id, batch_idx, proof_id, ciphertexts, pd_1, pd_2, pd_3) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                (
                    "final_decrypt", teller_idx, batch_idx, proof_row_id,
                    json.dumps(batch_ciph),
                    json.dumps(batch_pd),
                    json.dumps(batch_pd2),
                    json.dumps(batch_pd3),
                ),
            )

        compound_pd.append(res["d1"])
        compound_pd2.append(res["d2"])
        compound_pd3.append(res["d3"])

    compound_maps = [
        [dict(row) for row in dataset]
        for dataset in [compound_pd, compound_pd2, compound_pd3]
    ]

    final_pd, final_pd2, final_pd3 = [], [], []
    final_pds = [final_pd, final_pd2, final_pd3]
    all_keys = [key for key, _ in compound_pd[0]]

    for i in all_keys:
        for dataset_idx in range(3):
            subtemp = [row.get(i, None) for row in compound_maps[dataset_idx]]
            final_pds[dataset_idx].append([i, subtemp])

    print("Decryption first part done in ", time.time() - time_now)

    teller0 = tellers[0]
    vote_list = json.loads(teller0.call_full_decrypt(json.dumps(final_pd,  cls=ECCEncoder), tagged_json, 1))
    comm_list = json.loads(teller0.call_full_decrypt(json.dumps(final_pd2, cls=ECCEncoder), tagged_json, 2))
    trap_list = json.loads(teller0.call_full_decrypt(json.dumps(final_pd3, cls=ECCEncoder), tagged_json, 3))

    print("Decryption of votes done in ", time.time() - time_now)

    global decrypted
    decrypted = []
    for item in vote_list:
        index = item[0]
        comm = next((s[1] for s in comm_list if s[0] == index), None)
        trap = next((s[1] for s in trap_list if s[0] == index), None)
        decrypted.append({"v": item[1], "comm": comm, "dkey": trap})

    for trip in decrypted:
        cur.execute("SELECT max(id) FROM decrypted_extend_triplets")
        id = cur.fetchone()[0]
        id = 0 if id is None else int(id) + 1
        cur.execute(
            "INSERT INTO decrypted_extend_triplets (id, triplet) VALUES (%s, %s)",
            (id, json.dumps(trip)),
        )
