CREATE TABLE IF NOT EXISTS encryptedVotes (
    id        TEXT PRIMARY KEY,
    ballot    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tellers (
    id        TEXT PRIMARY KEY,
    t_pk      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS extendedVotes (
    id        TEXT PRIMARY KEY,
    ballot    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reencryptedTriplets (
    triplet    TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS decryptedTriplets (
    triplet     TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS finalTally (
    candidate_id  TEXT PRIMARY KEY,
    vote_count    INT
);

-- This function fires a notification at insertion into encryptedVotes
CREATE OR REPLACE FUNCTION notify_encrypted_vote()
RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify('encryptedVotes', row_to_json(NEW)::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- The trigger that calls the function on every INSERT
CREATE OR REPLACE TRIGGER encrypted_vote_inserted
AFTER INSERT ON "encryptedVotes"
FOR EACH ROW EXECUTE FUNCTION notify_encrypted_vote();