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

    def generate_verification_comm(self):
        self.secret_trapdoor_key = qr_data.get_trapdoor_key()
        g_ri_x = self.g_ri * self.secret_trapdoor_key
        return g_ri_x
    
    def verifyVote(self, voter, cur, g_vote): 
        verification_comm = self.generate_verification_comm()
        
        cur.execute("SELECT triplet FROM reencrypted_extend_triplets")
        rows = cur.fetchall()
        verification_bb = [row[0] for row in rows]
        
        entry = find_entry_by_comm(verification_comm, verification_bb)
        if (
            ECC.EccPoint(entry["v"]["x"], entry["v"]["y"], entry["v"]["curve"])
            == g_vote
        ):
            pass
        else:
            print("Error: Verification failed for voter" + str(voter.id))
            exit()

    def getBB(self):
        print("not implemented")

    def verifyTally(self):
        print("not implemented")