import json
from Crypto.PublicKey import ECC
from qr_backend import qr_data
import random

class VVerify:
    identifiers = [
        "Airplane",
        "Backpack",
        "Crown",
        "Candle",
        "Package",
        "Chair",
        "Star",
        "Cap",
        "Ladder",
        "Crab",
        "Basket",
        "Panda",
        "Shark",
        "Bus",
        "Bicycle",
        "Guitar",
        "Moon",
        "Sunflower"
    ]

    def getRandomIdentifier(self, list, identifiers):
        if len(list) == 0:
            return random.choice(identifiers)
        else :
            l = [x for x in identifiers if x not in list]
            return random.choice(l)


    def __init__(self, curve, id, vote_min, vote_max, cur,con):
        self.id = id
        self.vote_min = vote_min
        self.vote_max = vote_max
        self.curve = curve
        self.cur = cur
        self.con = con
    
    def getVoter(self, id):
        global voter 
        self.cur.execute("SELECT pk FROM registered_voters WHERE id = %s", (id,))
        row = self.cur.fetchone()
        voter = row[0]
        ##voter = VCaster(self.curve, id, self.vote_min, self.vote_max)
        
    def notify(self, encrypted_term):
        self.g_ri = encrypted_term

    def generate_verification_comm(self, dkey, c_id):
        self.secret_trapdoor_key = qr_data.get_trapdoor_key()
        g_ri_x = dkey * self.secret_trapdoor_key
        return g_ri_x
    
    def verifyVote(self, cur, triplet_start: int):
        cur.execute(
            "SELECT triplet FROM decrypted_triplets WHERE id >= %s AND id < %s",
            (triplet_start, triplet_start + self.vote_max)
        )
        rows = cur.fetchall()
        verification_bb = [row[0] for row in rows]

        v_id = triplet_start // self.vote_max
        cur.execute("SELECT voterid FROM registered_voters WHERE id = %s", (v_id,))
        voterid = cur.fetchone()[0]

        cur.execute("SELECT sk, true_identifier FROM voter_keys WHERE id = %s", (voterid,))
        row = cur.fetchone()
        true_key = row[0][0]
        voter_true_identifier = row[1]

        used_identifiers = []
        current_id = triplet_start

        for item in verification_bb:
            cur.execute("SELECT identifier FROM triplets_with_identifiers WHERE id = %s", (current_id,))
            existing = cur.fetchone()
            if existing is not None:
                used_identifiers.append(existing[0])
                current_id += 1
                continue

            d = item["dkey"]
            dkey_point = ECC.EccPoint(int(d["x"]), int(d["y"]), d.get("curve_name") or d.get("curve"))
            verification_comm = dkey_point * true_key

            c = item["comm"]
            comm_point = ECC.EccPoint(int(c["x"]), int(c["y"]), c.get("curve_name") or c.get("curve"))

            if comm_point == verification_comm:
                ident = voter_true_identifier
            else:
                excluded = used_identifiers + [voter_true_identifier]
                ident = self.getRandomIdentifier(excluded, self.identifiers)

            cur.execute(
                "INSERT INTO triplets_with_identifiers (id, triplet, identifier) VALUES (%s, %s, %s)",
                (current_id, json.dumps(item), ident)
            )
            current_id += 1
            used_identifiers.append(ident)
  
    
    def get_true_identifier(self, dkey, triplet_start, cur):
        cur.execute("SELECT sk FROM voter_keys WHERE id = %s", (self.id,))
        row = cur.fetchone()
        keys = row[0]
        true_key = keys[0]

        verification_comm = dkey * true_key

        cur.execute(
            "SELECT triplet, identifier FROM triplets_with_identifiers WHERE id >= %s AND id < %s",
            (triplet_start, triplet_start + self.vote_max)
        )
        rows = cur.fetchall()
        verification_bb = [row[0] for row in rows ]
        identifiers = [row[1] for row in rows]
        length = len(verification_bb)
        for i in range(length):
            item = verification_bb[i]
            point = ECC.EccPoint(
                item["comm"]["x"], item["comm"]["y"], item["comm"]["curve"]
            )
            if point == verification_comm:
                return identifiers[i]

        return None

    def getBB(self):
        print("not implemented")

    def verifyTally(self):
        print("not implemented")