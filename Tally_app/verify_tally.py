import gmpy2
from Tallying import Teller
from Decoding import decode_point_recursive
from util import deserialize_ep


def _decode_ciphertext(c):
    """[pt_dict, pt_dict, scalar] -> [ECC.EccPoint, ECC.EccPoint, mpz]"""
    return [
        deserialize_ep(c[0]),
        deserialize_ep(c[1]),
        gmpy2.mpz(c[2]), # pylint: disable=no-member
    ]


def _decode_triplet_list(lst):
    """[[ct, ct, ct], ...] where each ct is serialized -> deserialized form"""
    return [[_decode_ciphertext(ct) for ct in triplet] for triplet in lst]


def verify_tally(cur, con, tellers):
    print("=== VerifyTally starting ===", flush=True)
    errors = []

    # 1. Verify extension proofs (verify_proof_h_r + verify_proof_reenc)
    cur.execute("SELECT ballot_id, teller_id, proof FROM extension_proofs ORDER BY id")
    for ballot_id, teller_idx, proof_list in cur.fetchall():
        verifier = tellers[(teller_idx + 1) % len(tellers)]
        for record in proof_list:
            h_r_deser = {
                "c1": deserialize_ep(record["h_r"]["c1"]),
                "c2": deserialize_ep(record["h_r"]["c2"]),
            }
            enc_ptk_deser = [
                deserialize_ep(record["enc_ptk"][0]),
                deserialize_ep(record["enc_ptk"][1]),
            ]
            for j in range(len(record["proof"])):
                h_r_anti_deser = {
                    "c1": deserialize_ep(record["h_r_anti"][j]["c1"]),
                    "c2": deserialize_ep(record["h_r_anti"][j]["c2"]),
                }
                enc_ptk_anti_deser = [
                    deserialize_ep(record["enc_ptk_anti"][j][0]),
                    deserialize_ep(record["enc_ptk_anti"][j][1]),
                ]
                try:
                    Teller.verify_proof_h_r(
                        verifier.curve, enc_ptk_deser, h_r_deser,
                        enc_ptk_anti_deser, h_r_anti_deser,
                        record["proof"][j], verifier.public_key,
                    )
                except Exception as e:
                    errors.append(
                        f"verify_proof_h_r: ballot={ballot_id} teller={teller_idx} anti={j}: {e}"
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
            try:
                Teller.verify_proof_reenc(
                    verifier.curve, verifier.public_key,
                    reenc_deser, ev_deser, proof_reenc_deser, ballot_id,
                )
            except Exception as e:
                errors.append(
                    f"verify_proof_reenc: ballot={ballot_id} teller={teller_idx}: {e}"
                )

    # 2. Verify re-encryption mix proofs
    cur.execute(
        "SELECT phase, teller_id, ballot_id, proof FROM mix_proofs ORDER BY id"
    )
    mix_rows = cur.fetchall()

    cur.execute(
        "SELECT phase, teller_id, ballot_id, input_list FROM mix_inputs ORDER BY id"
    )
    input_lookup = {}
    for phase, teller_id, ballot_id, input_list in cur.fetchall():
        input_lookup[(phase, teller_id, ballot_id)] = input_list

    for phase, teller_id, ballot_id, proof in mix_rows:
        teller = tellers[teller_id]
        key = (phase, teller_id, ballot_id)
        if key not in input_lookup:
            errors.append(
                f"Missing mix input: phase={phase} teller={teller_id} ballot={ballot_id}"
            )
            continue

        list_0 = _decode_triplet_list(input_lookup[key])
        proof_deser = decode_point_recursive(proof)

        try:
            ok = teller.verify_re_enc_mix(list_0, proof_deser)
            if not ok:
                errors.append(
                    f"verify_re_enc_mix FAILED: phase={phase} teller={teller_id} ballot={ballot_id}"
                )
        except Exception as e:
            errors.append(
                f"verify_re_enc_mix exception: phase={phase} teller={teller_id} ballot={ballot_id}: {e}"
            )

    if errors:
        print(f"=== VerifyTally: {len(errors)} check(s) FAILED ===", flush=True)
        for err in errors:
            print(f"  [FAIL] {err}", flush=True)
    else:
        print("=== VerifyTally: all proofs verified OK ===", flush=True)
