import React from 'react';
import styles from '../afterVote-styled-comp/AfterVoteComponents.module.css';

const NextStepCard: React.FC = () => {
  return (
    <div className={styles.nextStepCard}>
      <h3 className={styles.nextStepTitle}>Next Step</h3>
      <p className={styles.nextStepText}>
        You can verify your vote in the <strong><em>SURTR Verify</em></strong> app on your computer after the election results are published.
      </p>
    </div>
  );
};

export default NextStepCard;
