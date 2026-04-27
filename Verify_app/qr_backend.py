from primitives import DSA, ChaumPedersenProof, ElGamalEncryption
from Crypto.PublicKey import ECC

class qr_data:
    
    secret_trapdoor_key = None
    
    def __init__(self, curve, id, vote_max):
        self.id = id
        self.curve = curve
        self.vote_max = vote_max

    def generate_trapdoor_keypair(self): #generate x1 and g^x1
            self.ege = ElGamalEncryption(self.curve)
            self.secret_trapdoor_key, self.public_trapdoor_key = self.ege.keygen()

            qr_data._secret_trapdoor_key = self.secret_trapdoor_key

    @classmethod
    def get_trapdoor_key(cls):
        return cls._secret_trapdoor_key        

    def generate_antitrapdoor_keypair(self):#generate x2 and g^x2
        self.secret_antitrapdoor_key = []
        self.public_antitrapdoor_key = []
        for i in range (self.vote_max - 1):
            temp_secret_antitrapdoor_key, temp_public_antitrapdoor_key = self.ege.keygen()
            self.secret_antitrapdoor_key.append(temp_secret_antitrapdoor_key)
            self.public_antitrapdoor_key.append(temp_public_antitrapdoor_key)

    def encrypt_trapdoor(self, teller_public_key): #encrypt g^x1
        self.encrypted_trapdoor = self.ege.encrypt(
            teller_public_key.Q, self.public_trapdoor_key
        )

    def encrypt_antitrapdoor(self, teller_public_key):#encrypt g^x2
        self.encrypted_antitrapdoor = []
        for i in range (self.vote_max - 1):
            self.encrypted_antitrapdoor.append(self.ege.encrypt(
                teller_public_key.Q, self.public_antitrapdoor_key[i]
            ))

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
        self.pok_antitrapdoor_key = []
        for i in range (len(self.encrypted_antitrapdoor)):
            encrypted_antitrapdoor = {
                "c1": self.encrypted_antitrapdoor[i][0],
                "c2": self.encrypted_antitrapdoor[i][1],
            }
            r = self.encrypted_antitrapdoor[i][2]
            chmp = ChaumPedersenProof(self.curve)
            self.pok_antitrapdoor_key.append(chmp.prove(
                encrypted_antitrapdoor,
                r,
                teller_public_key.Q,
                self.public_antitrapdoor_key[i],
            ))
