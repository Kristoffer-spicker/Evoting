import React from 'react';
import styles from '../afterVote-styled-comp/AfterVoteContent.module.css';
import AfterVoteHeader from './AfterVoteHeader';
import AfterVoteIcon from './AfterVoteIcon';
import AfterVoteMessage from './AfterVoteMessage';
import NextStepCard from './NextStepCard';
import DoneButton from './DoneButton';



interface AfterVoteContentProps {
  onDone: () => void;
}

const AfterVoteContent: React.FC<AfterVoteContentProps> = ({ onDone }) => {
  return (
    <div className={styles.mainContent}>
      <div className={styles.contentContainer}>
        <AfterVoteHeader />
        <AfterVoteIcon />
        <AfterVoteMessage />
        <NextStepCard />
      </div>
      <DoneButton onClick={onDone} />
    </div>
  );
};

export default AfterVoteContent;