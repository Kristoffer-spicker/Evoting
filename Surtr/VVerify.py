import multiprocessing
import hashlib
import random
import sqlite3

import threshold_crypto as tc
from util import (
    deserialize_ep,
    _ecc_key_to_serializable,
    serialize_pd,
    deserialize_pd,
)
from Crypto.PublicKey import ECC


from primitives import DSA, ElGamalEncryption, NIZK, ChaumPedersenProof
from exceptions import (
    InvalidSignatureException,
    InvalidProofException,
    InvalidWFNProofException,
)
from subroutines import Mixnet

con = sqlite3.connect("BulletinBoard.db")
cur = con.cursor()

class VVerify:
    def __init__(self):
        self.id = id

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