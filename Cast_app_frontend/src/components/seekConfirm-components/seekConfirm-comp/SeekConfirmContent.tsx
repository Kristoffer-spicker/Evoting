import React from 'react';
import { AlertCircle } from 'lucide-react';
import styles from '../seekConfirm-styled-comp/SeekConfirmContent.module.css';

interface SeekConfirmContentProps {
  candidateName?: string;
  onConfirmVote?: () => void;
  onChangeSelection?: () => void;
}

const SeekConfirmContent: React.FC<SeekConfirmContentProps> = ({
  candidateName = 'Jack Sparrow',
  onConfirmVote,
  onChangeSelection
}) => {
  const handleConfirmVote = () => {
    if (onConfirmVote) {
      onConfirmVote();
    }
  };

  const handleChangeSelection = () => {
    if (onChangeSelection) {
      onChangeSelection();
    }
  };

  return (
    <div className={styles.mainContent}>
      <div className={styles.scrollableContent}>
        <div className={styles.contentWrapper}>
  
          <h1 className={styles.pageHeader}>Confirm Selection</h1>

   
          <div className={styles.selectionContainer}>
            <p className={styles.selectionLabel}>You have selected:</p>
            <p className={styles.candidateName}>{candidateName}</p>
          </div>
        </div>
      </div>

   
      <div className={styles.fixedBottomSection}>
        <div className={styles.bottomContent}>
      
          <div className={styles.warningBox}>
            <AlertCircle className={styles.warningIcon} />
            <div className={styles.warningTextContainer}>
              <p className={styles.warningText}>
                Selecting <strong>'Confirm Vote'</strong> will cast your vote for this candidate.
              </p>
              <p className={styles.warningText}>
                Review your selection carefully before confirming.
              </p>
              <p className={styles.warningText}>
                This action cannot be changed.
              </p>
            </div>
          </div>

        
          <div className={styles.buttonContainer}>
            <button
              onClick={handleConfirmVote}
              className={styles.confirmButton}
            >
              Confirm Vote
            </button>
            <button
              onClick={handleChangeSelection}
              className={styles.changeButton}
            >
              Change Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeekConfirmContent;
