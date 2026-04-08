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
def decode_ciphertext(c):
    """Decode a single ciphertext — handles both dict and list formats"""
    if isinstance(c, dict):
        # Dict format: {'c1': {...}, 'c2': {...}, 'r_anti': ...}
        return [
            ECC.EccPoint(int(c['c1']['x']), int(c['c1']['y']), 'P-256'),
            ECC.EccPoint(int(c['c2']['x']), int(c['c2']['y']), 'P-256'),
            gmpy2.mpz(c['r_anti'])
        ]
    elif isinstance(c, list):
        # List format: [{x,y}, {x,y}, int]
        return [
            ECC.EccPoint(int(c[0]['x']), int(c[0]['y']), 'P-256'),
            ECC.EccPoint(int(c[1]['x']), int(c[1]['y']), 'P-256'),
            gmpy2.mpz(c[2])
        ]
    else:
        raise ValueError(f"Unexpected ciphertext format: {type(c)}")

def decode_bb_data(row):
    bb_data = row

    # --- SPK ---
    spk_data = bb_data['spk']
    if isinstance(spk_data, dict):
        bb_data['spk'] = ECC.construct(
            curve=spk_data["curve_name"],
            point_x=int(spk_data["x"]),
            point_y=int(spk_data["y"])
        )
    elif isinstance(spk_data, str):
        bb_data['spk'] = ECC.import_key(spk_data)

    # --- Trapdoor keys ---
    bb_data['stk'] = gmpy2.mpz(bb_data['stk'])
    bb_data['sum_r'] = gmpy2.mpz(bb_data['sum_r'])

    # Fix: use enumerate to actually mutate the list
    bb_data['stk_anti'] = [gmpy2.mpz(x) for x in bb_data['stk_anti']]

    # --- Signature ---
    bb_data['sig'] = bytes.fromhex(bb_data['sig'])

    # --- Single ciphertexts ---
    for key in ['ev', 'enc_ptk']:
        bb_data[key] = decode_ciphertext(bb_data[key])

    # --- Lists of ciphertexts ---
    for key in ['ev_anti', 'enc_ptk_anti']:
        bb_data[key] = [decode_ciphertext(c) for c in bb_data[key]]

    # --- Proofs ---
    for key in ['pi_1', 'pi_1_anti', 'pi_2', 'pi_3']:
        if key in bb_data:
            bb_data[key] = decode_point_recursive(bb_data[key])

    return bb_data