#!/bin/bash
set -e

: "${TALLY_USER:?TALLY_USER not set}"
: "${TALLY_PASSWORD:?TALLY_PASSWORD not set}"
: "${CAST_USER:?CAST_USER not set}"
: "${CAST_PASSWORD:?CAST_PASSWORD not set}"
: "${VERIFY_USER:?VERIFY_USER not set}"
: "${VERIFY_PASSWORD:?VERIFY_PASSWORD not set}"
: "${API_USER:?API_USER not set}"
: "${API_PASSWORD:?API_PASSWORD not set}"

psql -v ON_ERROR_STOP=1 \
     --username "$POSTGRES_USER" \
     --dbname "$POSTGRES_DB" <<EOSQL

-- tally_user
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${TALLY_USER}') THEN
        CREATE ROLE ${TALLY_USER} LOGIN PASSWORD '${TALLY_PASSWORD}';
    END IF;
END
\$\$;

GRANT CONNECT ON DATABASE "${POSTGRES_DB}" TO ${TALLY_USER};
GRANT USAGE ON SCHEMA public TO ${TALLY_USER};
GRANT SELECT, INSERT ON TABLE
    extended_votes, reencrypted_triplets, reencrypted_extend_triplets,
    decrypted_triplets, decrypted_extend_triplets, final_tally,
    extension_proofs, mix_proofs, mix_inputs, decryption_proofs, decryption_inputs
    TO ${TALLY_USER};
GRANT SELECT ON TABLE encrypted_votes TO ${TALLY_USER};
GRANT SELECT, INSERT ON TABLE tellers, candidates TO ${TALLY_USER};
GRANT USAGE, SELECT ON SEQUENCE
    mix_proofs_id_seq, mix_inputs_id_seq,
    decryption_proofs_id_seq, decryption_inputs_id_seq,
    extension_proofs_id_seq
    TO ${TALLY_USER};

-- cast_user
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${CAST_USER}') THEN
        CREATE ROLE ${CAST_USER} LOGIN PASSWORD '${CAST_PASSWORD}';
    END IF;
END
\$\$;

GRANT CONNECT ON DATABASE "${POSTGRES_DB}" TO ${CAST_USER};
GRANT USAGE ON SCHEMA public TO ${CAST_USER};
GRANT SELECT ON TABLE tellers, registered_voters, decrypted_triplets, candidates
    TO ${CAST_USER};
GRANT INSERT ON TABLE registered_voters, encrypted_votes, candidates
    TO ${CAST_USER};

-- verify_user
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${VERIFY_USER}') THEN
        CREATE ROLE ${VERIFY_USER} LOGIN PASSWORD '${VERIFY_PASSWORD}';
    END IF;
END
\$\$;

GRANT CONNECT ON DATABASE "${POSTGRES_DB}" TO ${VERIFY_USER};
GRANT USAGE ON SCHEMA public TO ${VERIFY_USER};
GRANT SELECT ON TABLE tellers, voter_keys, final_tally, registered_voters,
    decrypted_triplets, triplets_with_identifiers, candidates
    TO ${VERIFY_USER};
GRANT INSERT ON TABLE voter_keys, triplets_with_identifiers
    TO ${VERIFY_USER};

-- api_user
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${API_USER}') THEN
        CREATE ROLE ${API_USER} LOGIN PASSWORD '${API_PASSWORD}';
    END IF;
END
\$\$;

GRANT CONNECT ON DATABASE "${POSTGRES_DB}" TO ${API_USER};
GRANT USAGE ON SCHEMA public TO ${API_USER};
GRANT SELECT ON TABLE candidates, tellers TO ${API_USER};

-- Lock cast_user out of writing once tallying is complete
CREATE OR REPLACE FUNCTION lock_writes_after_tally()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS \$func\$
BEGIN
    IF (SELECT COUNT(*) FROM final_tally) >= (SELECT COUNT(*) FROM candidates) THEN
        EXECUTE 'REVOKE INSERT ON TABLE encrypted_votes, registered_voters FROM ${CAST_USER}';
    END IF;
    RETURN NEW;
END;
\$func\$;

CREATE OR REPLACE TRIGGER lock_after_tally
AFTER INSERT ON final_tally
FOR EACH ROW EXECUTE FUNCTION lock_writes_after_tally();

EOSQL
