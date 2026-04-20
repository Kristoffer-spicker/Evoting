import React from 'react';
import styles from '../ballot-styled-comp/BallotHeader.module.css';

const BallotHeader: React.FC = () => {
  return (
    <div className={styles.headerContainer}>
      <h1 className={styles.headerTitle}>Personalized Ballot</h1>
    </div>
  );
};

export default BallotHeader;
