import json
import multiprocessing
import traceback
import gmpy2

from curve import Curve
from Tallying import Teller
from Encoding import ECCEncoder
from Decoding import decode_bb_data, decode_point_recursive
from util import deserialize_ep
from subroutines import Mixnet


def _decode_ciphertext(c):
    # r must be gmpy2.mpz — the Mixnet hashes str(list), so int vs mpz would diverge.
    if isinstance(c, list):
        return [deserialize_ep(c[0]), deserialize_ep(c[1]), gmpy2.mpz(c[2])]
    elif isinstance(c, dict) and 'c1' in c:
        r = c.get('r', c.get('r_anti', 0))
        return [deserialize_ep(c['c1']), deserialize_ep(c['c2']), gmpy2.mpz(r)]
    return c


def _decode_triplet_list(lst):
    """[[ct, ct, ct], ...] with serialized points → ECC point objects."""
    return [[_decode_ciphertext(ct) for ct in triplet] for triplet in lst]


def teller_worker(conn, teller_id, sk_share, public_key, curve_name):
    """Long-lived teller process. Owns its Teller instance, dispatches ops from pipe."""
    curve = Curve(curve_name)
    teller = Teller(curve, sk_share, public_key)

    pk_share_pt = curve.raise_p(sk_share.y)
    conn.send({
        "ok": True,
        "op": "init",
        "public_key_share": teller.serialize_ecc_point(pk_share_pt),
    })

    while True:
        try:
            msg = conn.recv()
        except EOFError:
            break

        op = msg["op"]
        if op == "shutdown":
            break

        try:
            if op == "raise_h":
                raw = json.loads(msg["data"])
                current_list = [[item[0], decode_bb_data(item[1])] for item in raw]
                q1, q2, q3 = multiprocessing.Queue(), multiprocessing.Queue(), multiprocessing.Queue()
                teller.mp_raise_h(current_list, q1, q2, q3)
                conn.send({"ok": True, "proofs": q1.get(), "registry": q2.get(), "output": q3.get()})

            elif op == "reencrypt_mix":
                triplets = _decode_triplet_list(json.loads(msg["data"]))
                result = teller.re_encryption_mix(triplets)
                conn.send({"ok": True, "result": json.dumps(list(result), cls=ECCEncoder)})

            elif op == "partial_decrypt":
                # Keep ciphertexts as dicts — mp_partial_decrypt accesses ["x"], ["y"], ["curve"] directly
                tagged = json.loads(msg["data"])
                n = msg["n"]
                split = teller.ciphertext_list_split(tagged, n)

                batch_queues, processes = [], []
                for ciph in split:
                    pq1, pq2, pq3, pq4 = (multiprocessing.Queue() for _ in range(4))
                    p = multiprocessing.Process(
                        target=teller.mp_partial_decrypt, args=(ciph, pq1, pq2, pq3, pq4)
                    )
                    p.daemon = True
                    processes.append(p)
                    batch_queues.append((pq1, pq2, pq3, pq4))
                for p in processes:
                    p.start()

                d1, d2, d3, proofs = [], [], [], []
                per_batch = [[], [], []]
                for p, (pq1, pq2, pq3, pq4) in zip(processes, batch_queues):
                    b1, b2, b3, bp = pq1.get(), pq2.get(), pq3.get(), pq4.get()
                    d1 += b1; d2 += b2; d3 += b3
                    proofs.append(bp)
                    per_batch[0].append(b1)
                    per_batch[1].append(b2)
                    per_batch[2].append(b3)
                for p in processes:
                    p.join()

                conn.send({
                    "ok": True,
                    "d1": d1, "d2": d2, "d3": d3,
                    "proofs": proofs,
                    "per_batch_pd": per_batch[0],
                    "per_batch_pd2": per_batch[1],
                    "per_batch_pd3": per_batch[2],
                })

            elif op == "full_decrypt":
                pd_in = json.loads(msg["pd_in"])
                tagged = json.loads(msg["tagged"])
                col = msg["col"]
                q1 = multiprocessing.Queue()
                split = teller.ciphertext_list_split(pd_in, multiprocessing.cpu_count())
                processes = [
                    multiprocessing.Process(
                        target=teller.mp_full_decrypt, args=(ciph, tagged, col, q1)
                    )
                    for ciph in split
                ]
                for p in processes:
                    p.daemon = True
                    p.start()
                data = []
                for p in processes:
                    data = data + q1.get()
                for p in processes:
                    p.join()
                conn.send({"ok": True, "result": json.dumps(data, cls=ECCEncoder)})

        except Exception as e:
            conn.send({"ok": False, "error": str(e), "traceback": traceback.format_exc()})


class TellerProxy:
    """
    Drop-in replacement for Teller in the coordinator process.
    Public-data operations (verify, tag, split, validate) run locally.
    Secret-key operations (raise_h, mixnet, partial/full decrypt) go to the teller process.
    """

    def __init__(self, conn, teller_id, curve, public_key, public_key_share_pt):
        self._conn = conn
        self.teller_id = teller_id
        self.curve = curve
        self.public_key = public_key
        # Pre-computed curve.raise_p(sk.y) — public info, cached so coordinator never stores sk.
        self.public_key_share = public_key_share_pt

        # Lightweight local Teller for verify/utility ops that need no secret key.
        # Uses a one-of-one dummy threshold key — secret key never leaves the worker.
        import threshold_crypto as tc
        _params = tc.ThresholdParameters(1, 1)
        _pub, _shares = tc.create_public_key_and_shares_centralized(curve.get_pars(), _params)
        self._local = Teller(curve, _shares[0], public_key)

    # ------------------------------------------------------------------
    # Internal pipe helper
    # ------------------------------------------------------------------

    def _call(self, msg):
        self._conn.send(msg)
        result = self._conn.recv()
        if not result["ok"]:
            raise RuntimeError(
                f"Teller {self.teller_id} error: {result.get('error')}\n"
                f"{result.get('traceback', '')}"
            )
        return result

    # ------------------------------------------------------------------
    # Local ops — no secret key needed
    # ------------------------------------------------------------------

    def tag_ciphertexts(self, list_0):
        return self._local.tag_ciphertexts(list_0)

    def ciphertext_list_split(self, list_0, n):
        return self._local.ciphertext_list_split(list_0, n)

    def validate_ballot(self, curve, teller_public_key, ballot):
        return self._local.validate_ballot(curve, teller_public_key, ballot)

    def verify_re_enc_mix(self, list_0, proof):
        return self._local.verify_re_enc_mix(list_0, proof)

    def verify_decryption_proof(self, tau, p_1, p_2, w, public_key_share,
                                ciphertexts, partial_decryptions, ct_idx):
        return self._local.verify_decryption_proof(
            tau, p_1, p_2, w, public_key_share, ciphertexts, partial_decryptions, ct_idx
        )

    def serialize_ecc_point(self, p):
        return self._local.serialize_ecc_point(p)

    # ------------------------------------------------------------------
    # Pipe ops — secret key used inside teller process
    # ------------------------------------------------------------------

    def call_raise_h(self, current_list_json):
        """Returns dict with keys: proofs, registry, output (all JSON strings)."""
        return self._call({"op": "raise_h", "data": current_list_json})

    def call_reencrypt_mix(self, triplets_json):
        """Returns JSON string of the full re_encryption_mix result (result[0] is shuffled list)."""
        return self._call({"op": "reencrypt_mix", "data": triplets_json})["result"]

    def call_partial_decrypt(self, tagged_json, n):
        """Returns dict: d1, d2, d3, proofs, per_batch_pd, per_batch_pd2, per_batch_pd3."""
        return self._call({"op": "partial_decrypt", "data": tagged_json, "n": n})

    def call_full_decrypt(self, pd_in_json, tagged_json, col):
        """Returns JSON string of [[index, point_dict], ...] decrypted results."""
        return self._call({
            "op": "full_decrypt",
            "pd_in": pd_in_json,
            "tagged": tagged_json,
            "col": col,
        })["result"]

    def shutdown(self):
        self._conn.send({"op": "shutdown"})
