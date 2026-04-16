import React from 'react';
import styles from '../afterVote-styled-comp/AfterVoteComponents.module.css';

const AfterVoteHeader: React.FC = () => {
  return (
    <div className={styles.headerContainer}>
      <h1 className={styles.headerTitle}>Voting Completed</h1>
    </div>
  );
};

export default AfterVoteHeader;
