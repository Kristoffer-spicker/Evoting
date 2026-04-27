from util import find_entry_by_comm
from Crypto.PublicKey import ECC





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
        self.cur.execute(
            "SELECT trapdoor_key FROM voter_trapdoor_keys WHERE voterid = %s",
            (self.id,)
        )
        row = self.cur.fetchone()
        if row is None or row[0] is None:
            raise ValueError(f"No trapdoor key found for voter {self.id} — QR code must be generated before verifying")
        self.secret_trapdoor_key = int(row[0])
        print("secret trapdoor key", self.secret_trapdoor_key, flush=True)
        print("dkey", dkey, flush=True)
        g_ri_x = dkey * self.secret_trapdoor_key
        return g_ri_x
    
    def verifyVote(self, cur, g_vote, dkey):
        verification_comm = self.generate_verification_comm(dkey)
        print(f"verification_comm x={int(verification_comm.x)} y={int(verification_comm.y)}", flush=True)

        cur.execute("SELECT triplet FROM decrypted_triplets")
        rows = cur.fetchall()
        verification_bb = [row[0] for row in rows]
        print(f"bulletin board size: {len(verification_bb)}", flush=True)
        for entry in verification_bb:
            c = entry.get('comm')
            print(f"  bb comm x={c['x']} y={c['y']}", flush=True)

        entry = find_entry_by_comm(verification_comm, verification_bb)
        if entry is None:
            return False

        return ECC.EccPoint(entry["v"]["x"], entry["v"]["y"], entry["v"]["curve"]) == g_vote

    def getBB(self):
        print("not implemented")

    def verifyTally(self):
        print("not implemented")