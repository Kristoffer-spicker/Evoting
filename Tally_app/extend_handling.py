import json
import multiprocessing
import traceback
from Decoding import decode_bb_data
from Encoding import ECCEncoder
from util import deserialize_ep
from Tallying import Teller

def handler(notify, con, tellers):
    """
    The function called when a new vote is found in the table
    Takes a encrypted vote decodes, extends and encodes it
    Finally the extended and encoded vote is added to the extended_votes table
    """
    print("New ballot Received", flush=True)
    con = con
    cur = con.cursor()
    cur.execute("SELECT ballot FROM encrypted_votes WHERE id = %s", (notify,))
    ballot = cur.fetchone()[0]
    verify_teller = tellers[0]
    decoded = decode_bb_data(ballot)
    if (Teller.validate_ballot(self=verify_teller, curve=verify_teller.curve, teller_public_key=verify_teller.public_key, ballot=decoded)):
        extended_ballot = extend_and_encode_vote(decoded, tellers)
        parsed = json.loads(extended_ballot)

        cur.execute(
            "INSERT INTO extended_votes (id, ballot) VALUES (%s, %s) ON CONFLICT (id) DO UPDATE SET ballot = EXCLUDED.ballot", (parsed["id"], json.dumps(parsed["ballot"]))
        )
        con.commit()
        cur.close()
        con.close()
    

    
def extend_and_encode_vote(decoded, tellers):
    """
    Takes an encoded vote 
    The vote is then decoded
    Then the decoded vote is run through the mp_raise_h function which extends the vote this is done with multiprocessing
    Lastly it builts the final extended vote and finally encoded via the custom encoder from the encoding class
    """
    try:

        current_list = [[decoded["id"], decoded]]
        combined_outputs = []
        teller_registry = []

            
        for teller in tellers:
            q1 = multiprocessing.Queue()
            q2 = multiprocessing.Queue()
            q3 = multiprocessing.Queue()
            print("started queues", flush=True)
            p = multiprocessing.Process(
                target = teller.mp_raise_h, args=(current_list, q1, q2, q3)
            )
            p.start()
            try:
                print(f"[PARENT] waiting for q1.get()", flush=True)
                teller_proofs = json.loads(q1.get())
                print(f"[PARENT] got from q1.get()", flush=True)
                for record in teller_proofs:
                    h_r_deser = {
                        "c1": deserialize_ep(record["h_r"]["c1"]),
                        "c2": deserialize_ep(record["h_r"]["c2"]),
                    }
                    enc_ptk_deser = [
                        deserialize_ep(record["enc_ptk"][0]),
                        deserialize_ep(record["enc_ptk"][1]),
                    ]
                    for i in range(len(record["proof"])):
                        h_r_anti_deser = {
                            "c1": deserialize_ep(record["h_r_anti"][i]["c1"]),
                            "c2": deserialize_ep(record["h_r_anti"][i]["c2"]),
                        }
                        enc_ptk_anti_deser = [
                            deserialize_ep(record["enc_ptk_anti"][i][0]),
                            deserialize_ep(record["enc_ptk_anti"][i][1]),
                        ]
                        Teller.verify_proof_h_r(
                            teller.curve,
                            enc_ptk_deser,
                            h_r_deser,
                            enc_ptk_anti_deser,
                            h_r_anti_deser,
                            record["proof"][i],
                            teller.public_key,
                        )
                    reenc_deser = [
                        deserialize_ep(record["reenc"][0]),
                        deserialize_ep(record["reenc"][1]),
                        record["reenc"][2],
                    ]
                    ev_deser = [
                        deserialize_ep(record["ev"][0]),
                        deserialize_ep(record["ev"][1]),
                    ]
                    proof_reenc_deser = {
                        "t_1": deserialize_ep(record["proof_re_enc"]["t_1"]),
                        "t_2": deserialize_ep(record["proof_re_enc"]["t_2"]),
                        "s_1": record["proof_re_enc"]["s_1"],
                    }
                    Teller.verify_proof_reenc(
                        teller.curve,
                        teller.public_key,
                        reenc_deser,
                        ev_deser,
                        proof_reenc_deser,
                        record["id"],
                    )
                print(f"[PARENT] proofs verified", flush=True)
                print(f"[PARENT] waiting for q2.get()", flush=True)
                _ = json.loads(q2.get())
                print(f"[PARENT] waiting for q3.get()", flush=True)
                combined_outputs.append(json.loads(q3.get()))
                print(f"[PARENT] got from q3.get()", flush=True)
            except Exception as e:
                print(f"[PARENT] ERROR: {e}", flush=True)
                traceback.print_exc()
                raise
            finally:
                q2.get()
                q3.get()
                p.join()
            
               

       
        raised = []
        for i in range(len(combined_outputs[0])):
            ballot = combined_outputs[0][i][1]
            prod_a = deserialize_ep(ballot["h_r"]["c1"])
            prod_b = deserialize_ep(ballot["h_r"]["c2"])
            prod_a_anti = []
            prod_b_anti = []
            for k in range(len(ballot["h_r_anti"])):
                prod_a_anti.append(deserialize_ep(ballot["h_r_anti"][k]["c1"]))
                prod_b_anti.append(deserialize_ep(ballot["h_r_anti"][k]["c2"]))
            sum_r = ballot["h_r"]["r"]

            sum_r_anti = []
            for l in range(len(ballot["h_r_anti"])):
                sum_r_anti.append(ballot["h_r_anti"][l]["r_anti"])

            enc_gr_c1 = deserialize_ep(ballot["enc_gr"][0])
            enc_gr_c2 = deserialize_ep(ballot["enc_gr"][1])
            enc_gr_r = ballot["enc_gr"][2]

            for j in range(1, len(combined_outputs)):
                b = combined_outputs[j][i][1]
                prod_a = prod_a + deserialize_ep(b["h_r"]["c1"])
                prod_b = prod_b + deserialize_ep(b["h_r"]["c2"])
                sum_r = sum_r + b["h_r"]["r"]
                for m in range (len(b["h_r_anti"])):
                    prod_a_anti[m] = prod_a_anti[m] + deserialize_ep(b["h_r_anti"][m]["c1"])
                    prod_b_anti[m] = prod_b_anti[m] + deserialize_ep(b["h_r_anti"][m]["c2"])
                for n in range (len(b["h_r_anti"])):
                    sum_r_anti[n] = sum_r_anti[n] + b["h_r_anti"][n]["r_anti"]
                enc_gr_c1 = enc_gr_c1 + deserialize_ep(b["enc_gr"][0])
                enc_gr_c2 = enc_gr_c2 + deserialize_ep(b["enc_gr"][1])
                enc_gr_r = enc_gr_r + b["enc_gr"][2]

            ballot["h_r"] = {"c1": prod_a, "c2": prod_b, "r": sum_r}
            ballot["h_r_anti"] = [
                {"c1": prod_a_anti[o], "c2": prod_b_anti[o], "r_anti": sum_r_anti[o]}
                for o in range(len(prod_a_anti))
            ]
            ballot["enc_gr"] = [
                {"x": int(enc_gr_c1.x), "y": int(enc_gr_c1.y), "curve": enc_gr_c1.curve},
                {"x": int(enc_gr_c2.x), "y": int(enc_gr_c2.y), "curve": enc_gr_c2.curve},
                enc_gr_r,
            ]
            raised.append([combined_outputs[0][i][0], ballot])

        extended_ballot = {"id": decoded["id"], "ballot": raised}
        encoded_ballot = json.dumps(extended_ballot, cls=ECCEncoder)
        return encoded_ballot
    except Exception as e:
        print("extend_and_encode_vote FAILED:", e, flush=True)
        traceback.print_exc()
        raise

