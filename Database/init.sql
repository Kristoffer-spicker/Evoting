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
    id        TEXT PRIMARY KEY,
    pk        JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS ctr (
    token        TEXT PRIMARY KEY,
    ctr_content  JSONB NOT NULL

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


-- The trigger that calls the function on every INSERT
CREATE OR REPLACE TRIGGER encrypted_vote_inserted
AFTER INSERT ON encrypted_votes
FOR EACH ROW EXECUTE FUNCTION notify_encrypted_vote();

-- Trigger for extended_votes
CREATE OR REPLACE TRIGGER extended_vote_inserted
AFTER INSERT ON extended_votes
FOR EACH ROW EXECUTE FUNCTION notify_extended_vote();
