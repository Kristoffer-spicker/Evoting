import random
import sqlite3
import json
import gmpy2
# pylint: disable=no-member

from primitives import DSA, ChaumPedersenProof, ElGamalEncryption
from Crypto.PublicKey import ECC

#Encoding ECC objects to JSON formatting
class ECCEncoder(json.JSONEncoder): #JSONEncoder is a class from the json module that is used to convert python objects to JSON formatting.

    def default(self, obj):
        if isinstance(obj, ECC.EccKey): # For the part of the object that is a EccKey and exports it in a PEM format, which is another format for storing keys 
            return obj.export_key(format='PEM')
        if isinstance(obj, ECC.EccPoint): # EccPoints are converted to a standard coordinate format with its x and y coordinates
            return {"x": str(obj.x), "y": str(obj.y)} 
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
        
    def get_candidates(self, list):
        print ("not implemented")

    def cast_vote(self): #Function for the vote chosen by the voter
        print("not implemented")

    def generate_dsa_keys(self):
        dsa = DSA(self.curve)
        self.secret_key, self.public_key = dsa.keygen()
    
    def encrypt_vote(self, teller_public_key):
        self.g_vote = self.curve.raise_p(int(self.vote))
        self.encrypted_vote = self.ege.encrypt(
            teller_public_key.Q, self.g_vote
        )

    def encrypt_antivote(self, teller_public_key):
        self.ege = ElGamalEncryption(self.curve)
        self.g_antivote = self.curve.raise_p(int(abs(self.vote-1)))
        self.encrypted_antivote = self.ege.encrypt(
            teller_public_key.Q, self.g_antivote
        )

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
        encrypted_antivote = {
            "c1": self.encrypted_antivote[0],
            "c2": self.encrypted_antivote[1],
        }
        r = self.encrypted_antivote[2]
        chmp = ChaumPedersenProof(self.curve)
        self.wellformedness_proof_anti = chmp.prove_or_n(
            encrypted_antivote,
            r,
            teller_public_key.Q,
            self.vote_max,
            int(abs(self.vote-1)),
            self.id,
        )

    def generate_trapdoor_keypair(self): #generate x1 and g^x1
        self.ege = ElGamalEncryption(self.curve)
        self.secret_trapdoor_key, self.public_trapdoor_key = self.ege.keygen()

    def generate_antitrapdoor_keypair(self):#generate x2 and g^x2
        self.secret_antitrapdoor_key, self.public_antitrapdoor_key = self.ege.keygen()

    def encrypt_trapdoor(self, teller_public_key): #encrypt g^x1
        self.encrypted_trapdoor = self.ege.encrypt(
            teller_public_key.Q, self.public_trapdoor_key
        )

    def encrypt_antitrapdoor(self, teller_public_key):#encrypt g^x2
        self.encrypted_antitrapdoor = self.ege.encrypt(
            teller_public_key.Q, self.public_antitrapdoor_key
        )

    def generate_pok_trapdoor_keypair(self, teller_public_key): #prove that the voter knows g^x1 and r
        encrypted_trapdoor = {
            "c1": self.encrypted_trapdoor[0],
            "c2": self.encrypted_trapdoor[1],
        }
        r = self.encrypted_trapdoor[2]
        chmp = ChaumPedersenProof(self.curve)
        self.pok_trapdoor_key = chmp.prove(
            encrypted_trapdoor,     #enc(g^x1)
            r,
            teller_public_key.Q,
            self.public_trapdoor_key, #g^x1
        )

    def generate_pok_antitrapdoor_keypair(self, teller_public_key):#prove that the voter knows g^x2 and r
        encrypted_antitrapdoor = {
            "c1": self.encrypted_antitrapdoor[0],
            "c2": self.encrypted_antitrapdoor[1],
        }
        r = self.encrypted_antitrapdoor[2]
        chmp = ChaumPedersenProof(self.curve)
        self.pok_antitrapdoor_key = chmp.prove(
            encrypted_antitrapdoor,
            r,
            teller_public_key.Q,
            self.public_antitrapdoor_key,
        )

    def sign_ballot(self):
        self.dsa = DSA(self.curve)
        self.sum_r = self.encrypted_vote[2]+self.encrypted_antivote[2]
        hash = self.curve.hash_to_mpz(
            str(self.encrypted_vote)
            + str(self.encrypted_antivote) 
            + str(self.encrypted_trapdoor)
            + str(self.encrypted_antitrapdoor)
            + str(self.pok_trapdoor_key)
            + str(self.pok_antitrapdoor_key)
            + str(self.wellformedness_proof)
            + str(self.wellformedness_proof_anti)
            + str(self.sum_r)    
        )
        self.signature = self.dsa.sign(self.secret_key, hash)
        bb_data = {
            "id": self.id,
            "spk": self.public_key,
            "sig": self.signature,
            # only for poc
            "stk": self.secret_trapdoor_key,
            "stk_anti": self.secret_antitrapdoor_key,
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
        self.cur.execute("INSERT INTO encryptedVotes VALUES (?, ?)", (self.id, json.dumps(bb_data, cls=ECCEncoder),))
        self.con.commit()

    
   