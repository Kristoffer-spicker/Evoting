import multiprocessing
import hashlib
import random

import threshold_crypto as tc
import gmpy2
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

class VCaster:
    def __init__(self, curve, id, vote_min, vote_max):
        self.id = id
        self.vote_min = vote_min
        self.vote_max = vote_max
        self.curve = curve

    def give_vote(self): #Function for the vote chosen by the voter
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
        return bb_data