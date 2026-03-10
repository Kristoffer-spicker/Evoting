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