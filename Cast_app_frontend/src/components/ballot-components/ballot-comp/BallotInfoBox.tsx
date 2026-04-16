import React from 'react';
import { AlertTriangle } from 'lucide-react';
import styles from '../ballot-styled-comp/BallotInfoBox.module.css';

const BallotInfoBox: React.FC = () => {
  return (
    <div className={styles.warningContainer}>
      <div className={styles.warningContent}>
        <div className={styles.warningHeader}>
          <AlertTriangle className={styles.infoIcon} />
          <p className={styles.warningTitle}>Important</p>
        </div>
        <p className={styles.warningMessage}>
          This step is for coerced voters. If you are not under coercion, you do not need to follow the instructions for coercion protection on this page and may scroll down and click ‘<strong>Complete Voting Process’</strong>.
        </p>
        <p className={styles.warningMessage}>
          If you are under coercion,  you may follow the Instructions for coercion protection below, then click ‘<strong>Complete Voting Process.</strong>’
        </p>
      </div>
    </div>
  );
};

export default BallotInfoBox;
