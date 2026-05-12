import json
import traceback
import time
from Decoding import decode_bb_data
from Encoding import ECCEncoder
from Tallying import Teller
from util import deserialize_ep

tally_start = None

def handler(notify, con, tellers):
    global tally_start
    if tally_start is None:
        tally_start = time.time()
    print("New ballot Received", flush=True)
    cur = con.cursor()
    cur.execute("SELECT ballot FROM encrypted_votes WHERE id = %s", (notify,))
    ballot = cur.fetchone()[0]
    verify_teller = tellers[0]
    decoded = decode_bb_data(ballot)
    if Teller.validate_ballot(
        self=verify_teller,
        curve=verify_teller.curve,
        teller_public_key=verify_teller.public_key,
        ballot=decoded,
    ):
        extended_ballot = extend_and_encode_vote(decoded, tellers, cur)
        parsed = json.loads(extended_ballot)
        cur.execute(
            "INSERT INTO extended_votes (id, ballot) VALUES (%s, %s) ON CONFLICT (id) DO NOTHING",
            (parsed["id"], json.dumps(parsed["ballot"])),
        )
        con.commit()
    cur.close()
    con.close()


def extend_and_encode_vote(decoded, tellers, cur):
    try:
        current_list = [[decoded["id"], decoded]]
        combined_outputs = []

        for teller_idx, teller in enumerate(tellers):
            # Serialize the ballot (contains ECC points) for pipe transport.
            data_json = json.dumps(current_list, cls=ECCEncoder)
            result = teller.call_raise_h(data_json)

            proofs_raw = result["proofs"]
            cur.execute(
                "INSERT INTO extension_proofs (ballot_id, teller_id, proof) VALUES (%s, %s, %s)",
                (decoded["id"], teller_idx, proofs_raw),
            )
            _ = json.loads(result["registry"])
            combined_outputs.append(json.loads(result["output"]))

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
            sum_r_anti = [ballot["h_r_anti"][l]["r_anti"] for l in range(len(ballot["h_r_anti"]))]

            enc_gr_c1 = deserialize_ep(ballot["enc_gr"][0])
            enc_gr_c2 = deserialize_ep(ballot["enc_gr"][1])
            enc_gr_r = ballot["enc_gr"][2]

            for j in range(1, len(combined_outputs)):
                b = combined_outputs[j][i][1]
                prod_a = prod_a + deserialize_ep(b["h_r"]["c1"])
                prod_b = prod_b + deserialize_ep(b["h_r"]["c2"])
                sum_r = sum_r + b["h_r"]["r"]
                for m in range(len(b["h_r_anti"])):
                    prod_a_anti[m] = prod_a_anti[m] + deserialize_ep(b["h_r_anti"][m]["c1"])
                    prod_b_anti[m] = prod_b_anti[m] + deserialize_ep(b["h_r_anti"][m]["c2"])
                for n in range(len(b["h_r_anti"])):
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
        return json.dumps(extended_ballot, cls=ECCEncoder)
    except Exception as e:
        print("extend_and_encode_vote FAILED:", e, flush=True)
        traceback.print_exc()
        raise
