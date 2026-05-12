import json
import multiprocessing
import time
from Decoding import decode_extended_ballot
from Encoding import ECCEncoder
import extend_handling


def extend_handler(notify, con, tellers):
    """
    The function called when a new vote has been extended and is
    that vote is found in the extended_votes table
    Takes an extended vote, take the created triplets and re-encrypts the triplets, for 
    both the candidate voted for but also all other candidat options, and puts them trough a mixnet.
    Finally the re-encrypted triplets is added to the reencrypted_triplets table
    """
    data = notify
    con = con
    cur = con.cursor()
    cur.execute("SELECT ballot from extended_votes WHERE id = %s", (data,))
    ballot = cur.fetchone()[0]

    triplets = reencryptTriplets(ballot, tellers, data, cur)
    parsed = json.loads(triplets)
    # For-loop to go trough each triplet for a voter and insert them in the reencrypted_triplets table
    for trip in parsed:
        # Selects the highest id in the table
        cur.execute ( "SELECT max(id) FROM reencrypted_triplets")
        id = cur.fetchone()[0]
        if (id is None):
            id = 0
        else:
            id = int(id) + 1

        cur.execute(
            "INSERT INTO reencrypted_triplets (id, triplet) VALUES (%s, %s)", (id, json.dumps(trip),)
            )


    con.commit()

    triplet_decryption(parsed, tellers, cur)
    con.commit()
    cur.close()
    con.close()



def reencryptTriplets(ballot, tellers, ballot_id, cur):
    """
    Takes an encoded extended vote
    That vote is then decodeed
    Then the triplet for the candidate voted for is pulled out, and the triplets for
    the remainign candidates not voted for and added to a triplets list.
    Then the triplets are put trough the encryption mixnet
    Lastly the re-encrypted triplets are encoded after the mixnet via the custom encoder from the encoding class
    Mix proofs are stored in mix_proofs per teller for later VerifyTally use.
    """
    decoded_list = json.loads(ballot) if isinstance(ballot, str) else ballot

    triplets = []

    for _, single_ballot in decoded_list:
        decoded = decode_extended_ballot(single_ballot)

        triplets.append([decoded["ev"], decoded["h_r"], decoded["enc_gr"]])

        for i in range(len(decoded["ev_anti"])):
            triplets.append([
                decoded["ev_anti"][i],
                decoded["h_r_anti"][i],
                decoded["enc_gr"]
            ])

    for teller_idx, teller in enumerate(tellers):
        cur.execute(
            "INSERT INTO mix_inputs (phase, teller_id, ballot_id, input_list) VALUES (%s, %s, %s, %s)",
            ("triplet_reenc", teller_idx, ballot_id, json.dumps(triplets, cls=ECCEncoder))
        )
        result = teller.re_encryption_mix(triplets)
        triplets = result[0]
        cur.execute(
            "INSERT INTO mix_proofs (phase, teller_id, ballot_id, proof) VALUES (%s, %s, %s, %s)",
            ("triplet_reenc", teller_idx, ballot_id, json.dumps(list(result), cls=ECCEncoder))
        )

    return json.dumps(triplets, cls=ECCEncoder)


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
            ("triplet_decrypt", teller_idx, json.dumps(proofs, cls=ECCEncoder))
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
                ("triplet_decrypt", teller_idx, batch_idx, proof_row_id,
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
        cur.execute ( "SELECT max(id) FROM decrypted_triplets")
        id = cur.fetchone()[0]
        if (id is None):
            id = 0
        else:
            id = int(id) + 1

        cur.execute(
            "INSERT INTO decrypted_triplets (id, triplet) VALUES (%s, %s)", (id, json.dumps(trip),)
            )

    if extend_handling.tally_start is not None:
        print(f"Total tallying time (first extension → triplet decryption): {time.time() - extend_handling.tally_start:.2f}s", flush=True)
        extend_handling.tally_start = None
