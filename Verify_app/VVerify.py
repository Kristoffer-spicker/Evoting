import json
from util import find_entry_by_comm
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
        print("secret trapdoor key", self.secret_trapdoor_key, flush=True)
        print("dkey", dkey, flush=True)
        g_ri_x = dkey * self.secret_trapdoor_key
        return g_ri_x
    
    def verifyVote(self, cur, triplet_start : int, dkey):

        cur.execute("SELECT sk FROM voter_keys WHERE id = %s", (self.id,))
        row = cur.fetchone()
        keys = row[0]
        true_key = keys[0]

        #The Tre Identifier
        true_i = ""
        cur.execute(
            "SELECT triplet FROM decrypted_triplets WHERE id >= %s AND id < %s",
            (triplet_start, triplet_start + self.vote_max)
        )
        rows = cur.fetchall()
        verification_bb = [row[0] for row in rows]
        #List to make sure tht the voters vote and anti votes doesnt have the same indetifier
        used_identifiers = []
        print("key", true_key, flush=True)

        # Loop for creating a mapping between a triplet and its identifier
        
        verification_comm = dkey * true_key
        print("verification comm", verification_comm, flush=True)
        for item in verification_bb:
            cur.execute ("SELECT identifier FROM triplets_with_identifiers WHERE id = %s", (triplet_start,))
            identifier = cur.fetchone()
            if identifier is not None:
                point = ECC.EccPoint(
                    item["comm"]["x"], item["comm"]["y"], item["comm"]["curve"]
                )
                if point == verification_comm:
                    true_i = identifier
                triplet_start += 1
                continue

            ident = self.getRandomIdentifier(used_identifiers, self.identifiers)
            cur.execute("INSERT INTO triplets_with_identifiers (id, triplet, identifier) VALUES (%s, %s, %s)", ( triplet_start, json.dumps(item), ident))
            triplet_start += 1
            used_identifiers.append(ident)
            point = ECC.EccPoint(
                item["comm"]["x"], item["comm"]["y"], item["comm"]["curve"]
            )
            if point == verification_comm:
                true_i = ident
        
        print("true_i", true_i, flush=True)
        return true_i

    def getBB(self):
        print("not implemented")

    def verifyTally(self):
        print("not implemented")