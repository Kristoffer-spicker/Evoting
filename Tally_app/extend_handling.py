import json
import multiprocessing
import traceback
from Decoding import decode_bb_data
from Encoding import ECCEncoder
from util import deserialize_ep

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

    extended_ballot = extend_and_encode_vote(ballot, tellers)
    parsed = json.loads(extended_ballot)

    cur.execute(
        "INSERT INTO extended_votes (id, ballot) VALUES (%s, %s) ON CONFLICT (id) DO UPDATE SET ballot = EXCLUDED.ballot", (parsed["id"], json.dumps(parsed["ballot"]))
    )

    con.commit()
    cur.close()
    con.close()

    
def extend_and_encode_vote(row, tellers):
    """
    Takes an encoded vote 
    The vote is then decoded
    Then the decoded vote is run through the mp_raise_h function which extends the vote this is done with multiprocessing
    Lastly it builts the final extended vote and finally encoded via the custom encoder from the encoding class
    """
    try:
        decoded = decode_bb_data(row)

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
                _ = json.loads(q1.get())
                print(f"[PARENT] waiting for q2.get()", flush=True)
                _ = json.loads(q2.get())
                print(f"[PARENT] waiting for q3.get()", flush=True)
                combined_outputs.append(json.loads(q3.get()))
                print(f"[PARENT] got from q3.get()", flush=True)
            except Exception as e:
                print(f"[PARENT] ERROR getting queue: {e}", flush=True)
                
            
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

            ballot["h_r"] = {"c1": prod_a, "c2": prod_b, "r": sum_r}
            ballot["h_r_anti"] = [
                {"c1": prod_a_anti[o], "c2": prod_b_anti[o], "r_anti": sum_r_anti[o]}
                for o in range(len(prod_a_anti))
            ]
            raised.append([combined_outputs[0][i][0], ballot])

        extended_ballot = {"id": decoded["id"], "ballot": raised}
        encoded_ballot = json.dumps(extended_ballot, cls=ECCEncoder)
        return encoded_ballot
    except Exception as e:
        print("extend_and_encode_vote FAILED:", e, flush=True)
        traceback.print_exc()
        raise

