import React from 'react';
import styles from '../afterVote-styled-comp/AfterVoteComponents.module.css';

const AfterVoteMessage: React.FC = () => {
  return (
    <div className={styles.messageContainer}>
      <p className={styles.messageText}>
        You have successfully completed the voting process.
      </p>
    </div>
  );
};

export default AfterVoteMessage;
