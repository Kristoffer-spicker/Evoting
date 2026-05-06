import json
import gmpy2
import time
import multiprocessing
from Crypto.PublicKey import ECC
from Encoding import ECCEncoder

# pylint: disable=no-member

def finaltripletdecoder (single_triplet):
    def to_point(d):
        return ECC.EccPoint(int(d['x']), int(d['y']), 'P-192')

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
    # Retrieving the 3 elements from the newly generated tripelt with the actual vote
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
    if not triplets:
        print("final_triplets: no extended votes yet, skipping", flush=True)
        return
    tripletsdecoded = []
    for trip in triplets:
        decoded = (finaltripletdecoder(trip))
        tripletsdecoded.append([
                decoded["re_enc"],
                decoded["new_com"],
                decoded["new_key"]
            ])
    
    for teller_idx, teller in enumerate(tellers):
        cur.execute(
            "INSERT INTO mix_inputs (phase, teller_id, ballot_id, input_list) VALUES (%s, %s, %s, %s)",
            ("final_reenc", teller_idx, None, json.dumps(tripletsdecoded, cls=ECCEncoder))
        )
        result = teller.re_encryption_mix(tripletsdecoded)
        tripletsdecoded = result[0]
        cur.execute(
            "INSERT INTO mix_proofs (phase, teller_id, ballot_id, proof) VALUES (%s, %s, %s, %s)",
            ("final_reenc", teller_idx, None, json.dumps(list(result), cls=ECCEncoder))
        )
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

        structured_trip = {
        "comm": trip[1],  # new_com / enc_gy
        "v": trip[0],     # re_enc
        "key": trip[2]    # new_key / enc_gs
    }    
        
        cur.execute(
            "INSERT INTO reencrypted_extend_triplets (id, triplet) VALUES (%s, %s)", (id, json.dumps(structured_trip),)
            )

        con.commit()

    triplet_decryption(mixedtrips, tellers, cur)
    candidate_tallying(decrypted, cur)
    con.commit()
    
def candidate_tallying(decrypted_trips, cur):
    cur.execute(""" SELECT MAX(id) FROM candidates """)
    num_candidates = cur.fetchone()[0]

    final_result = [0] * (num_candidates + 1)
    for trip in decrypted_trips:
        raw = trip["v"]  # this is the decrypted ECC point as a dict {"x": ..., "y": ...}

        # Normalize to match DB format
        normalized = {
            "x": str(raw["x"]),
            "y": str(raw["y"]),
            "curve_name": raw.get("curve_name") or raw.get("curve")
        }

        # Match against candidates table (curve_p is JSONB)
        cur.execute(
            "SELECT id FROM candidates WHERE curve_p = %s::jsonb",
            (json.dumps(normalized),)
        )
        candidate = cur.fetchone()

        if not candidate:
            print(f"No candidate found for vote: {normalized}", flush=True)
            continue  # skip invalid/spoiled votes instead of crashing

        candidate_id = candidate[0]
        

        final_result[candidate_id] += 1
    
    for i in range(num_candidates + 1):
        cur.execute(
            "INSERT INTO final_tally (candidate_id, vote_count) VALUES (%s, %s)",
            (i, final_result[i])
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
    split_ciphertexts = tellers[1].ciphertext_list_split(
        tagged_ciphertexts, multiprocessing.cpu_count()
    )
    compound_pd = []
    compound_pd2 = []
    compound_pd3 = []
    for teller_idx, teller in enumerate(tellers):
        batch_queues = []
        processes = []
        for ciph in split_ciphertexts:
            pq1 = multiprocessing.Queue()
            pq2 = multiprocessing.Queue()
            pq3 = multiprocessing.Queue()
            pq4 = multiprocessing.Queue()
            p = multiprocessing.Process(
                target=teller.mp_partial_decrypt, args=(ciph, pq1, pq2, pq3, pq4)
            )
            p.daemon = True
            processes.append(p)
            batch_queues.append((pq1, pq2, pq3, pq4))
        for p in processes:
            p.start()
        data = []
        data2 = []
        data3 = []
        proofs = []
        per_batch_pd = []
        per_batch_pd2 = []
        per_batch_pd3 = []
        for i, (p, (pq1, pq2, pq3, pq4)) in enumerate(zip(processes, batch_queues)):
            batch_d = pq1.get()
            batch_d2 = pq2.get()
            batch_d3 = pq3.get()
            batch_proof = pq4.get()
            data = data + batch_d
            data2 = data2 + batch_d2
            data3 = data3 + batch_d3
            proofs.append(batch_proof)
            per_batch_pd.append(batch_d)
            per_batch_pd2.append(batch_d2)
            per_batch_pd3.append(batch_d3)
        for p in processes:
            p.join()
            # p.close()
        cur.execute(
            "INSERT INTO decryption_proofs (phase, teller_id, proof) VALUES (%s, %s, %s) RETURNING id",
            ("final_decrypt", teller_idx, json.dumps(proofs, cls=ECCEncoder))
        )
        proof_row_id = cur.fetchone()[0]
        for batch_idx, (batch_ciph, batch_pd, batch_pd2, batch_pd3) in enumerate(
            zip(split_ciphertexts, per_batch_pd, per_batch_pd2, per_batch_pd3)
        ):
            if not batch_ciph:
                continue
            cur.execute(
                "INSERT INTO decryption_inputs "
                "(phase, teller_id, batch_idx, proof_id, ciphertexts, pd_1, pd_2, pd_3) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                ("final_decrypt", teller_idx, batch_idx, proof_row_id,
                 json.dumps(batch_ciph),
                 json.dumps(batch_pd),
                 json.dumps(batch_pd2),
                 json.dumps(batch_pd3))
            )
        compound_pd.append(data)
        compound_pd2.append(data2)
        compound_pd3.append(data3)

    

    final_pd = []
    final_pd2 = []
    final_pd3 = []
    

    compound_maps = [
        [dict(row) for row in dataset]
        for dataset in [compound_pd, compound_pd2, compound_pd3]
    ]
    
    final_pd, final_pd2, final_pd3 = [], [], []
    final_pds = [final_pd, final_pd2, final_pd3]
    
    all_keys = [key for key, _ in compound_pd[0]]  # keys like 0, 1, 2, ...
    
    for i in all_keys:
        for dataset_idx in range(3):
            subtemp = [row.get(i, None) for row in compound_maps[dataset_idx]]
            final_pds[dataset_idx].append([i, subtemp])
    
    print("Decryption first part done in ",time.time() - time_now)

    global decrypted
    q1 = multiprocessing.Queue()
    #1 ciphertext (votes)
    split_ciphertexts = tellers[0].ciphertext_list_split(
        final_pd, multiprocessing.cpu_count()
    )
    processes = [
        multiprocessing.Process(
            target=tellers[0].mp_full_decrypt,
            args=(ciph, tagged_ciphertexts, 1, q1),
        )
        for ciph in split_ciphertexts
    ]
    for p in processes:
        p.daemon = True
        p.start()
    data = []
    for p in processes:
        data = data + q1.get()

    for p in processes:
        p.join()
        # p.close()
    vote_list = data



    print("Decryption of votes  done in ",time.time() - time_now)
    time_now = time.time()
    #2 ciphertext (commitments)
    split_ciphertexts = tellers[0].ciphertext_list_split(
        final_pd2, multiprocessing.cpu_count()
    )
    processes = [
        multiprocessing.Process(
            target=tellers[0].mp_full_decrypt,
            args=(ciph, tagged_ciphertexts, 2, q1),
        )
        for ciph in split_ciphertexts
    ]
    for p in processes:
        p.daemon = True
        p.start()
    data = []
    for p in processes:
        data = data + q1.get()

    for p in processes:
        p.join()
        # p.close()
    comm_list = data
    
    print("Decryption of trapdoors  done in ",time.time() - time_now)
    time_now = time.time()
    #3 ciphertext (tellers' trapdoor)
    split_ciphertexts = tellers[0].ciphertext_list_split(
        final_pd3, multiprocessing.cpu_count()
    )
    processes = [
        multiprocessing.Process(
            target=tellers[0].mp_full_decrypt,
            args=(ciph, tagged_ciphertexts, 3, q1),
        )
        for ciph in split_ciphertexts
    ]
    for p in processes:
        p.daemon = True
        p.start()
    data = []
    for p in processes:
        data = data + q1.get()

    for p in processes:
        p.join()
        # p.close()
    trap_list = data
    print("Decryption of dual keys  done in ",time.time() - time_now)

    comm = None
    trap = None
    decrypted = []
    for item in vote_list:
        index = item[0]
        for subitem in comm_list:
            if subitem[0] == index:
                comm = subitem[1]
                for asubitem in trap_list:
                    if asubitem[0] == index:
                        trap = asubitem[1]
                        break
                decrypted.append({"v": item[1], "comm": comm, "dkey": trap})

    for trip in decrypted:
        cur.execute ( "SELECT max(id) FROM decrypted_extend_triplets")
        id = cur.fetchone()[0]
        if (id is None):
            id = 0
        else: 
            id = int(id) + 1
            
        cur.execute(
            "INSERT INTO decrypted_extend_triplets (id, triplet) VALUES (%s, %s)", (id, json.dumps(trip),)
            )
