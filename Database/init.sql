CREATE TABLE IF NOT EXISTS encrypted_votes (
    id        TEXT PRIMARY KEY,
    ballot    JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS candidates (
    id        INT PRIMARY KEY,
    curve_p   JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS tellers (
    id        TEXT PRIMARY KEY,
    t_pk      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS extended_votes (
    id        TEXT PRIMARY KEY,
    ballot    JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS reencrypted_triplets (
    id         INT PRIMARY KEY,
    triplet    JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS reencrypted_extend_triplets (
    id         INT PRIMARY KEY,
    triplet    JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS decrypted_triplets (
    id         INT PRIMARY KEY,
    triplet    JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS decrypted_extend_triplets (
    id         INT PRIMARY KEY,
    triplet    JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS final_tally (
    candidate_id  TEXT PRIMARY KEY,
    vote_count    INT
);

CREATE TABLE IF NOT EXISTS registered_voters (
    id        INT PRIMARY KEY,
    voterid   TEXT NOT NULL,
    pk        JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS voter_keys (
    id               TEXT PRIMARY KEY,
    sk               JSONB NOT NULL,
    true_identifier  TEXT
);

CREATE TABLE IF NOT EXISTS triplets_with_identifiers (
    id         INT PRIMARY KEY,
    triplet    JSONB NOT NULL,
    identifier TEXT
);

-- Stores re-encryption mixnet proofs per teller per phase.
-- phase: 'triplet_reenc' (per-ballot, triplet_handling.py)
--        'final_reenc'   (all-ballot, extended_triplets.py)
-- ballot_id is NULL for the final phase (all ballots mixed together).
CREATE TABLE IF NOT EXISTS mix_proofs (
    id          SERIAL PRIMARY KEY,
    phase       TEXT NOT NULL,
    teller_id   INT  NOT NULL,
    ballot_id   TEXT,
    proof       JSONB NOT NULL
);

-- Stores the input list fed into each teller's re_encryption_mix call.
-- Needed by VerifyTally: verify_re_enc_mix requires the pre-shuffle list_0.
CREATE TABLE IF NOT EXISTS mix_inputs (
    id          SERIAL PRIMARY KEY,
    phase       TEXT NOT NULL,
    teller_id   INT  NOT NULL,
    ballot_id   TEXT,
    input_list  JSONB NOT NULL
);

-- Stores partial-decryption proofs per teller per phase.
-- phase: 'triplet_decrypt' or 'final_decrypt'
-- proof is an array of proof dicts, one per process chunk.
CREATE TABLE IF NOT EXISTS decryption_proofs (
    id          SERIAL PRIMARY KEY,
    phase       TEXT NOT NULL,
    teller_id   INT  NOT NULL,
    proof       JSONB NOT NULL
);

-- Stores extension proofs from mp_raise_h per teller per ballot.
-- Each row is the q1 output: a list of records with h_r, enc_ptk, proof, reenc, proof_re_enc.
CREATE TABLE IF NOT EXISTS extension_proofs (
    id          SERIAL PRIMARY KEY,
    ballot_id   TEXT NOT NULL,
    teller_id   INT  NOT NULL,
    proof       JSONB NOT NULL
);

-- Stores per-batch ciphertexts and partial decryptions for decryption proof verification.
-- TEXT columns (not JSONB) preserve JSON key order, which is required because
-- str() of these dicts is used verbatim in the Chaum-Pedersen hash computation.
-- proof_id links each batch back to its row in decryption_proofs.
CREATE TABLE IF NOT EXISTS decryption_inputs (
    id          SERIAL PRIMARY KEY,
    phase       TEXT NOT NULL,
    teller_id   INT  NOT NULL,
    batch_idx   INT  NOT NULL,
    proof_id    INT  NOT NULL REFERENCES decryption_proofs(id),
    ciphertexts TEXT NOT NULL,
    pd_1        TEXT NOT NULL,
    pd_2        TEXT NOT NULL,
    pd_3        TEXT NOT NULL
);


-- This function fires a notification at insertion into encryptedVotes
CREATE OR REPLACE FUNCTION notify_encrypted_vote()
RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify('encrypted_votes', NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for extended_votes notifications
CREATE OR REPLACE FUNCTION notify_extended_vote()
RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify('extended_votes', NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for decrypted_triplets notifications
CREATE OR REPLACE FUNCTION notify_decrypted_triplets_vote()
RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify('decrypted_triplets',  NEW.id::TEXT);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;



-- The trigger that calls the function on every INSERT
CREATE OR REPLACE TRIGGER encrypted_vote_inserted
AFTER INSERT ON encrypted_votes
FOR EACH ROW EXECUTE FUNCTION notify_encrypted_vote();

-- Trigger for extended_votes
CREATE OR REPLACE TRIGGER extended_vote_inserted
AFTER INSERT ON extended_votes
FOR EACH ROW EXECUTE FUNCTION notify_extended_vote();

CREATE OR REPLACE TRIGGER decrypted_triplets_inserted
AFTER INSERT ON decrypted_triplets
FOR EACH ROW EXECUTE FUNCTION notify_decrypted_triplets_vote();

