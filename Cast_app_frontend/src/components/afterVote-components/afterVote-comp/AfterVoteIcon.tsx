import React from 'react';
import { CheckCircle } from 'lucide-react';
import styles from '../afterVote-styled-comp/AfterVoteComponents.module.css';

const AfterVoteIcon: React.FC = () => {
  return (
    <div className={styles.iconOuterContainer}>
      <div className={styles.iconCircle}>
        <CheckCircle className={styles.successIcon} strokeWidth={1.5} />
      </div>
    </div>
  );
};

export default AfterVoteIcon;
