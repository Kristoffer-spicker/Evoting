import random
import json
import gmpy2
import requests
# pylint: disable=no-member

from primitives import DSA, ChaumPedersenProof, ElGamalEncryption
from Crypto.PublicKey import ECC

#Encoding ECC objects to JSON formatting
class ECCEncoder(json.JSONEncoder): #JSONEncoder is a class from the json module that is used to convert python objects to JSON formatting.

    def default(self, obj):
        if isinstance(obj, ECC.EccKey): # For the part of the object that is a EccKey and exports it in a PEM format, which is another format for storing keys 
            return obj.export_key(format='PEM')
        if isinstance(obj, ECC.EccPoint): # EccPoints are converted to a standard coordinate format with its x and y coordinates
            return {"x": str(obj.x), "y": str(obj.y), "curve_name": obj.curve} 
        if isinstance(obj, bytes): # Objects of the type bytes are converted to their hex codes
            return obj.hex()
        if isinstance(obj, gmpy2.mpz): # Objects of the type mpz are converted to integers
            return int(obj)
        return super().default(obj) # Returns the default value of the object
        
class VCaster:

    def __init__(self, curve, id, vote_min, vote_max, cur, con):
        self.id = id
        self.vote_min = vote_min
        self.vote_max = vote_max
        self.curve = curve
        self.cur = cur
        self.con = con


    def choose_vote_value(self):
        self.vote = random.randrange(self.vote_min, self.vote_max)
        
    #Function for the vote chosen by the voter  
    @staticmethod
    def _decode_ctr(obj):
        if isinstance(obj, dict) and 'x' in obj and 'y' in obj:
            return ECC.EccPoint(int(obj['x']), int(obj['y']), obj.get('curve_name', 'P-192'))
        elif isinstance(obj, dict):
            return {k: VCaster._decode_ctr(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [VCaster._decode_ctr(item) for item in obj]
        elif isinstance(obj, (int, float)) and not isinstance(obj, bool):
            return gmpy2.mpz(obj)
        return obj

    def cast_vote(self, teller_public_key):
        '''
        cast_vote: Function that takes a given candidates vote and cast it as a ballot
        '''
        print(f"id is {self.id} candidate is {self.vote}")
        self.encrypt_vote(teller_public_key)
        self.encrypt_antivote(teller_public_key)
        self.generate_wellformedness_proof(teller_public_key)
        self.generate_wellformedness_proof_anti(teller_public_key)
        print("Vote has been cast for", self.id)

    def generate_dsa_keys(self):
        dsa = DSA(self.curve)
        self.secret_key, self.public_key = dsa.keygen()
    
    def encrypt_vote(self, teller_public_key):
        self.ege = ElGamalEncryption(self.curve)
        self.g_vote = self.curve.raise_p(int(self.vote))
        self.encrypted_vote = self.ege.encrypt(
            teller_public_key.Q, self.g_vote
        )
            # Send g_vote directly to VVerify
        requests.post("http://verify_app:8002/receive_g_vote", json={
        "voter_id": self.id,
        "g_vote_x": str(self.g_vote.x),
        "g_vote_y": str(self.g_vote.y),
        "curve": self.g_vote.curve
    })

    def encrypt_antivote(self, teller_public_key): 
        self.encrypted_antivote = []
        # add for loop between 0 and vote_max that makes antivote and skips the candidate id actually voted on
        for i in range(self.vote_min, self.vote_max):
            if i == self.vote: 
                continue
            else:
                self.g_antivote = self.curve.raise_p(int(i))
                self.encrypted_antivote.append(self.ege.encrypt(
                    teller_public_key.Q, self.g_antivote
                ))
                print("Added antivote", self.encrypt_antivote, i, flush=True)

    def generate_wellformedness_proof(self, teller_public_key):
        encrypted_vote = {
            "c1": self.encrypted_vote[0],
            "c2": self.encrypted_vote[1],
        }
        r = self.encrypted_vote[2]
        chmp = ChaumPedersenProof(self.curve)
        self.wellformedness_proof = chmp.prove_or_n(
            encrypted_vote,
            r,
            teller_public_key.Q,
            self.vote_max,
            int(self.vote),
            self.id,
        )

    def generate_wellformedness_proof_anti(self, teller_public_key):
        self.wellformedness_proof_anti = []
        for i in range (0, len(self.encrypted_antivote)):
            encrypted_antivote = {
                "c1": self.encrypted_antivote[i][0],
                "c2": self.encrypted_antivote[i][1],
            }
            r = self.encrypted_antivote[i][2]
            chmp = ChaumPedersenProof(self.curve)
            self.wellformedness_proof_anti.append(chmp.prove_or_n(
                encrypted_antivote,
                r,
                teller_public_key.Q,
                self.vote_max,
                int(i),
                self.id,
            ))
    def sign_ballot(self):
        self.dsa = DSA(self.curve)
        anti_sum = sum(ct[2] for ct in self.encrypted_antivote)
        self.sum_r = self.encrypted_vote[2]+anti_sum
        hash = self.curve.hash_to_mpz(
            str(self.encrypted_vote)
            + str(self.encrypted_antivote)
            + str(self.encrypted_trapdoor)
            # Loop
            + str(self.encrypted_antitrapdoor)
            + str(self.pok_trapdoor_key)
            # Loop
            + str(self.pok_antitrapdoor_key)
            + str(self.wellformedness_proof)
            # Loop
            + str(self.wellformedness_proof_anti)
            + str(self.sum_r)    
        )
        self.signature = self.dsa.sign(self.secret_key, hash)
        bb_data = {
            "id": self.id,
            "spk": self.public_key,
            "sig": self.signature,
            "ev": self.encrypted_vote,
            "ev_anti": self.encrypted_antivote,
            "enc_ptk": self.encrypted_trapdoor,
            "enc_ptk_anti": self.encrypted_antitrapdoor,
            "pi_1": self.pok_trapdoor_key,
            "pi_1_anti": self.pok_antitrapdoor_key,
            "pi_2": self.wellformedness_proof,
            "pi_3": self.wellformedness_proof_anti,
            "sum_r": self.sum_r,
        }
        self.cur.execute("INSERT INTO encrypted_votes VALUES (%s, %s)", (self.id, json.dumps(bb_data, cls=ECCEncoder),)) # adds the final ballot to the BB
        self.con.commit()
    @classmethod
    def findVoter(cls, id, curve, vote_min, vote_max, cur, con):
        return cls(curve, id, vote_min, vote_max, cur, con)
    
