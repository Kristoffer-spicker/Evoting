from util import find_entry_by_comm
from Crypto.PublicKey import ECC
from qr_backend import qr_data





class VVerify:
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

    def generate_verification_comm(self, dkey):
        self.secret_trapdoor_key = qr_data.get_trapdoor_key()
        print("secret trapdoor key", self.secret_trapdoor_key, flush=True)
        print("dkey", dkey, flush=True)
        g_ri_x = dkey * self.secret_trapdoor_key
        return g_ri_x
    
    def verifyVote(self, cur, g_vote, dkey, triplet_start):
        verification_comm = self.generate_verification_comm(dkey)

        cur.execute(
            "SELECT triplet FROM decrypted_triplets WHERE id >= %s AND id < %s",
            (triplet_start, triplet_start + self.vote_max)
        )
        rows = cur.fetchall()
        verification_bb = [row[0] for row in rows]

        entry = find_entry_by_comm(verification_comm, verification_bb)
        if entry is None:
            return False

        return ECC.EccPoint(entry["v"]["x"], entry["v"]["y"], entry["v"]["curve"]) == g_vote

    def getBB(self):
        print("not implemented")

    def verifyTally(self):
        print("not implemented")