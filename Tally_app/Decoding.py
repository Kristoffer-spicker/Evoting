from Crypto.PublicKey import ECC
import gmpy2
import json
import threshold_crypto as tc
from util import to_tc_point
# pylint: disable=no-member


TrapdoorKeys = {'stk', 'stk_anti', 'sum_r'}
ECC_points = {'ev', 'ev_anti', 'enc_ptk', 'enc_ptk_anti'}
proofs = {'pi_1', 'pi_1_anti', 'pi_2', 'pi_3'}

def decode_bb_data2(row):
    bb_data = row # Loads the string of the ballot
    return {key: decode_value(key, value) for key, value in bb_data.items()}

def decode_value(key, value):
    if key == "spk":
        return ECC.import_key(value)
    elif key in TrapdoorKeys:
        return gmpy2.mpz(value)
    elif key == "sig":
       return bytes.fromhex(value)
    elif key in ECC_points:
        return [
            ECC.EccPoint(int(value[0]['x']), int(value[0]['y']), 'P-256'),
            ECC.EccPoint(int(value[1]['x']), int(value[1]['y']), 'P-256'),
            gmpy2.mpz(value[2])
        ]
    elif key in proofs:
        return decode_point_recursive(value)
    
    else :
        return value
    

    

# Decodes from x, y coordinates to EccPoints
def decode_point_recursive(obj):
    """Recursively convert any {x, y} dicts back to EccPoints in nested structures"""
    if isinstance(obj, dict) and 'x' in obj and 'y' in obj:
        return ECC.EccPoint(int(obj['x']), int(obj['y']), 'P-256')
    elif isinstance(obj, dict):
        return {k: decode_point_recursive(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decode_point_recursive(item) for item in obj]
    elif isinstance(obj, (int, float)) and not isinstance(obj, bool):
        return gmpy2.mpz(obj)
    return obj

# Decodes the ballots as stored in the database back to Ecc objects
def decode_bb_data(row):
    bb_data = json.loads(row[1]) # Loads the json string of the ballot

    # Converts the public key back to ECC key formattign
    bb_data['spk'] = ECC.import_key(bb_data['spk'])
    
    # Takes the integers for the trapdoor keys and the sum of r back to mpz formatting
    bb_data['stk'] = gmpy2.mpz(bb_data['stk'])
    bb_data['stk_anti'] = gmpy2.mpz(bb_data['stk_anti'])
    bb_data['sum_r'] = gmpy2.mpz(bb_data['sum_r'])
    
    # Takes the hex formatted signature and converts it back to bytes
    bb_data['sig'] = bytes.fromhex(bb_data['sig'])
    
    # Converts x,y coordinates back to EccPoints
    def to_point(d):
        return ECC.EccPoint(int(d['x']), int(d['y']), 'P-256')
    
    # for the vote, antivote, encrypted trapdoor key, and encrypted antitrapdoor key we convert the votes back to EccPoints and the keys to mpz formatting
    for key in ['ev', 'enc_ptk', 'enc_ptk_anti']:
        bb_data[key][0] = to_point(bb_data[key][0])
        bb_data[key][1] = to_point(bb_data[key][1])
        bb_data[key][2] = gmpy2.mpz(bb_data[key][2])

    for key in ['ev_anti']:
        for x in bb_data[key]:
            x[0] = to_point(x[0])
            x[1] = to_point(x[1])
            x[2] = gmpy2.mpz(x[2])
    
    # The proofs are converted from x,y coordinates to EccPoints using the decode_point_recursive function
    for key in ['pi_1', 'pi_1_anti', 'pi_2', 'pi_3']:
        if key in bb_data:
            bb_data[key] = decode_point_recursive(bb_data[key])

    # Finally the original ballot is returned
    return bb_data
