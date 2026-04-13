import json
from Decoding import decode_extended_ballot
from Encoding import ECCEncoder


def extend_handler(notify, con, tellers):
    """
    The function called when a new vote has been extended and is
    that vote is found in the extended_votes table
    Takes an extended vote, take the created triplets and re-encrypts the triplets, for 
    both the candidate voted for but also all other candidat options, and puts them trough a mixnet.
    Finally the re-encrypted triplets is added to the reencrypted_triplets table
    """
    data = notify
    con = con
    cur = con.cursor()
    cur.execute("SELECT ballot from extended_votes WHERE id = %s", (data,))
    ballot = cur.fetchone()[0]

    triplets = reencryptTriplets(ballot, tellers)
    parsed = json.loads(triplets)
    # For-loop to go trough each triplet for a voter and insert them in the reencrypted_triplets table
    for trip in parsed:
        # Selects the highest id in the table
        cur.execute ( "SELECT max(id) FROM reencrypted_triplets")
        id = cur.fetchone()[0]
        if (id is None):
            id = 0
            print("id is none updated to 0", flush=True)
        else: 
            id = int(id) + 1
            print("id is good :))", flush=True)
        
        cur.execute(
            "INSERT INTO reencrypted_triplets (id, triplet) VALUES (%s, %s)", (id, json.dumps(trip),)
            )


    con.commit()



def reencryptTriplets(ballot, tellers):
    """
    Takes an encoded extended vote
    That vote is then decodeed
    Then the triplet for the candidate voted for is pulled out, and the triplets for
    the remainign candidates not voted for and added to a triplets list.
    Then the triplets are put trough the encryption mixnet
    Lastly the re-encrypted triplets are encoded after the mixnet via the custom encoder from the encoding class
    """
    decoded_list = json.loads(ballot) if isinstance(ballot, str) else ballot

    triplets = []

    for ballot_id, single_ballot in decoded_list:
        decoded = decode_extended_ballot(single_ballot)  # ← use new decoder

        triplets.append([decoded["ev"], decoded["h_r"], decoded["enc_gr"]])

        for i in range(len(decoded["ev_anti"])):
            triplets.append([
                decoded["ev_anti"][i],
                decoded["h_r_anti"][i],
                decoded["enc_gr"]
            ])
    print("triplet example", triplets[1], flush=True)

    for teller in tellers:
        result = teller.re_encryption_mix(triplets)
        triplets = result[0]  # list_1 is the re-encrypted triplets

    return json.dumps(triplets, cls=ECCEncoder)