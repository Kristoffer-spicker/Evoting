import sqlite3
from VCaster import VCaster


from primitives import ElGamalEncryption, ChaumPedersenProof

con = sqlite3.connect("BulletinBoard.db")
cur = con.cursor()

class VVerify:
    def __init__(self, curve, id, vote_min, vote_max):
        
        
    def notify(self, encrypted_term):
        self.g_ri = encrypted_term

    def generate_verification_comm(self):
        g_ri_x = self.g_ri * self.secret_trapdoor_key
        return g_ri_x
    
    def verifyVote(self):
        print("not implemented")

    def getBB(self):
        print("not implemented")

    def verifyTally(self):
        print("not implemented")