import json
import multiprocessing
import time
from Decoding import decode_extended_ballot
from Encoding import ECCEncoder
import extend_handling


def extend_handler(notify, con, tellers):
    data = notify
    cur = con.cursor()
    cur.execute("SELECT ballot from extended_votes WHERE id = %s", (data,))
    ballot = cur.fetchone()[0]

    triplets = reencryptTriplets(ballot, tellers, data, cur)
    parsed = json.loads(triplets)
    for trip in parsed:
        cur.execute("SELECT max(id) FROM reencrypted_triplets")
        id = cur.fetchone()[0]
        id = 0 if id is None else int(id) + 1
        cur.execute(
            "INSERT INTO reencrypted_triplets (id, triplet) VALUES (%s, %s)",
            (id, json.dumps(trip)),
        )

    con.commit()
    triplet_decryption(parsed, tellers, cur)
    con.commit()
    cur.close()
    con.close()


def reencryptTriplets(ballot, tellers, ballot_id, cur):
    decoded_list = json.loads(ballot) if isinstance(ballot, str) else ballot

    triplets = []
    for _, single_ballot in decoded_list:
        decoded = decode_extended_ballot(single_ballot)
        triplets.append([decoded["ev"], decoded["h_r"], decoded["enc_gr"]])
        for i in range(len(decoded["ev_anti"])):
            triplets.append([decoded["ev_anti"][i], decoded["h_r_anti"][i], decoded["enc_gr"]])

    for teller_idx, teller in enumerate(tellers):
        triplets_json = json.dumps(triplets, cls=ECCEncoder)
        cur.execute(
            "INSERT INTO mix_inputs (phase, teller_id, ballot_id, input_list) VALUES (%s, %s, %s, %s)",
            ("triplet_reenc", teller_idx, ballot_id, triplets_json),
        )
        result_json = teller.call_reencrypt_mix(triplets_json)
        result = json.loads(result_json)
        triplets = result[0]
        cur.execute(
            "INSERT INTO mix_proofs (phase, teller_id, ballot_id, proof) VALUES (%s, %s, %s, %s)",
            ("triplet_reenc", teller_idx, ballot_id, result_json),
        )

    return json.dumps(triplets, cls=ECCEncoder)


def triplet_decryption(triplets, tellers, cur):
    time_now = time.time()

    # tag_ciphertexts and ciphertext_list_split are pure list ops — run on proxy locally.
    tagged_ciphertexts = tellers[1].tag_ciphertexts(triplets)
    n_cpu = multiprocessing.cpu_count()
    split_ciphertexts = tellers[1].ciphertext_list_split(tagged_ciphertexts, n_cpu)
    tagged_json = json.dumps(tagged_ciphertexts, cls=ECCEncoder)

    compound_pd, compound_pd2, compound_pd3 = [], [], []

    for teller_idx, teller in enumerate(tellers):
        res = teller.call_partial_decrypt(tagged_json, n_cpu)

        cur.execute(
            "INSERT INTO decryption_proofs (phase, teller_id, proof) VALUES (%s, %s, %s) RETURNING id",
            ("triplet_decrypt", teller_idx, json.dumps(res["proofs"], cls=ECCEncoder)),
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
                    "triplet_decrypt", teller_idx, batch_idx, proof_row_id,
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
    vote_list  = json.loads(teller0.call_full_decrypt(json.dumps(final_pd,  cls=ECCEncoder), tagged_json, 1))
    comm_list  = json.loads(teller0.call_full_decrypt(json.dumps(final_pd2, cls=ECCEncoder), tagged_json, 2))
    trap_list  = json.loads(teller0.call_full_decrypt(json.dumps(final_pd3, cls=ECCEncoder), tagged_json, 3))

    print("Decryption of votes done in ", time.time() - time_now)

    global decrypted
    decrypted = []
    for item in vote_list:
        index = item[0]
        comm = next((s[1] for s in comm_list if s[0] == index), None)
        trap = next((s[1] for s in trap_list if s[0] == index), None)
        decrypted.append({"v": item[1], "comm": comm, "dkey": trap})

    for trip in decrypted:
        cur.execute("SELECT max(id) FROM decrypted_triplets")
        id = cur.fetchone()[0]
        id = 0 if id is None else int(id) + 1
        cur.execute(
            "INSERT INTO decrypted_triplets (id, triplet) VALUES (%s, %s)",
            (id, json.dumps(trip)),
        )

    if extend_handling.tally_start is not None:
        print(
            f"Total tallying time (first extension → triplet decryption): "
            f"{time.time() - extend_handling.tally_start:.2f}s",
            flush=True,
        )
        extend_handling.tally_start = None
