from util import find_entry_by_comm
from Crypto.PublicKey import ECC
from Cast_app.VCaster import VCaster



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
        voter = VCaster(self.curve, id, self.vote_min, self.vote_max)
        
    def notify(self, encrypted_term):
        self.g_ri = encrypted_term

    def generate_verification_comm(self):
        g_ri_x = self.g_ri * voter.secret_trapdoor_key
        return g_ri_x
    
    def verifyVote(self, voter, cur): 
        verification_comm = voter.generate_verification_comm()
        a = 1 # Placeholder for accessing the database with the table of tallied votes
        entry = find_entry_by_comm(verification_comm, a)
        if (
            ECC.EccPoint(entry["v"]["x"], entry["v"]["y"], entry["v"]["curve"])
            == voter.g_vote
        ):
            pass
        else:
            print("Error: Verification failed for voter" + str(voter.id))
            exit()

    def getBB(self):
        print("not implemented")

    def verifyTally(self):
        print("not implemented")