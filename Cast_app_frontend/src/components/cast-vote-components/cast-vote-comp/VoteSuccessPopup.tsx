import React from 'react';
import styles from '../cast-vote-styled-comp/VoteSuccessPopup.module.css';

interface VoteSuccessPopupProps {
  isVisible: boolean;
  onContinue: () => void;
  onCancel: () => void;
  isDisabled?: boolean;
}

const VoteSuccessPopup: React.FC<VoteSuccessPopupProps> = ({
  isVisible,
  onContinue,
  onCancel,
  isDisabled = false
}) => {
  if (!isVisible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <div className={styles.content}>
          <p className={styles.firstParagraph}>
            On the next page, your ballot will be shown. This page is designed for coerced voting situations.
          </p>
          <p className={styles.warningParagraph}>
            Please review the information thoroughly, as you cannot return to this page.
          </p>
          <p className={styles.instructionsParagraph}>
            If you choose Cancel, you will only see the confirmation of your vote. If you are a coerced voter, please select Continue to view your ballot.
          </p>
        </div>
        <div className={styles.buttonContainer}>
          <button
            onClick={onCancel}
            className={styles.cancelButton}
            disabled={isDisabled}
          >
            Cancel
          </button>
          <button
            onClick={onContinue}
            className={styles.continueButton}
            disabled={isDisabled}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoteSuccessPopup;