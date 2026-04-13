import json
import gmpy2
from Crypto.PublicKey import ECC
# pylint: disable=no-member


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