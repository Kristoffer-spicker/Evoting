import React from 'react';
import CandidateSelection from './CandidateSelection.tsx';
import styles from '../cast-vote-styled-comp/CastVoteContent.module.css';

interface Party {
  name: string;
  candidates: string[];
}

interface CastVoteContentProps {
  parties: Party[];
  selectedCandidate: string;
  onCandidateSelect: (candidate: string) => void;
  onVote: () => void;
  onCancel: () => void;
  errorMessage?: string | null;
}

const CastVoteContent: React.FC<CastVoteContentProps> = ({
  parties,
  selectedCandidate,
  onCandidateSelect,
  onVote,
  onCancel,
  errorMessage
}) => {
  return (
    <div className={styles.mainContent}>
    
      <div className={styles.scrollableContent}>
        <div className={styles.contentWrapper}>
       
          <h1 className={styles.pageHeader}>Select Candidate</h1>

      
          <div className={styles.instructionsContainer}>
            <h3 className={styles.instructionTitle}>Instructions</h3>
            <p className={styles.instructionsText}>
             Select only one candidate from any party to cast your vote.
            </p>
          </div>

         
          {errorMessage && (
            <div className={styles.errorMessage}>
              {errorMessage}
            </div>
          )}

      
          <div className={styles.partiesContainer}>
            {parties.map((party, partyIndex) => (
              <CandidateSelection
                key={partyIndex}
                party={party}
                selectedCandidate={selectedCandidate}
                onCandidateSelect={onCandidateSelect}
              />
            ))}
          </div>
        </div>
      </div>

    
      <div className={styles.fixedBottomSection}>
        <div className={styles.buttonContainer}>
        
          <button
            onClick={onVote}
            disabled={!selectedCandidate}
            className={`${styles.voteButton} ${
              selectedCandidate ? styles.voteButtonEnabled : styles.voteButtonDisabled
            }`}
          >
            Vote
          </button>

         
          <button
            onClick={onCancel}
            className={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CastVoteContent;