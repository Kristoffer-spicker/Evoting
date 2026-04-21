import React from 'react';
import styles from '../cast-vote-styled-comp/CandidateSelection.module.css';

interface Party {
  name: string;
  candidates: string[];
}

interface CandidateSelectionProps {
  party: Party;
  selectedCandidate: string;
  onCandidateSelect: (candidate: string) => void;
}

const CandidateSelection: React.FC<CandidateSelectionProps> = ({
  party,
  selectedCandidate,
  onCandidateSelect
}) => {
  return (
    <div className={styles.partyContainer}>
      <h3 className={styles.partyName}>{party.name}</h3>
      <div className={styles.candidatesContainer}>
        {party.candidates.map((candidate, candidateIndex) => (
          <label
            key={candidateIndex}
            className={`${styles.candidateLabel} ${
              selectedCandidate === candidate
                ? styles.candidateLabelSelected
                : styles.candidateLabelDefault
            }`}
          >
            <input
              type="radio"
              name="candidate"
              value={candidate}
              checked={selectedCandidate === candidate}
              onChange={(e) => onCandidateSelect(e.target.value)}
              className={styles.candidateRadio}
            />
            <span className={styles.candidateName}>{candidate}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default CandidateSelection;