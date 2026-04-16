import React from 'react';
import styles from '../confirmation-styled-comp/VotedForCard.module.css';

interface VotedForCardProps {
  chosenCandidate: string;
}

const VotedForCard: React.FC<VotedForCardProps> = ({ chosenCandidate }) => {
  return (
    <div className={styles.votedForCard}>
      <p className={styles.votedForText}>
        You have voted for <span className={styles.candidateName}>"{chosenCandidate}"</span>.
      </p>
    </div>
  );
};

export default VotedForCard;