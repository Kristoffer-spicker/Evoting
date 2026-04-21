import React from 'react';
import { AlertTriangle } from 'lucide-react';
import styles from '../ballot-styled-comp/FinishVotingPopup.module.css';

interface FinishVotingPopupProps {
  isVisible: boolean;
  onFinishVoting: () => void;
  onReviewAgain: () => void;
}

const FinishVotingPopup: React.FC<FinishVotingPopupProps> = ({
  isVisible,
  onFinishVoting,
  onReviewAgain
}) => {
  if (!isVisible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <div className={styles.iconContainer}>
          <AlertTriangle className={styles.warningIcon} strokeWidth={2} />
        </div>
        <h2 className={styles.title}>Complete Voting Process?</h2>
        <p className={styles.subtitle}>You are about to complete the voting process</p>
        <p className={styles.message}>
          You won't be able to view your{' '}<span className={styles.boldItalic}>'Personalized Ballot'</span>{' '}again after continuing.
        </p>
        <p className={styles.question}>Do you want to continue?</p>
        <div className={styles.buttonContainer}>
          <button
            onClick={onFinishVoting}
            className={styles.finishButton}
          >
            Continue
          </button>
          <button
            onClick={onReviewAgain}
            className={styles.reviewButton}
          >
            Review Ballot Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinishVotingPopup;
