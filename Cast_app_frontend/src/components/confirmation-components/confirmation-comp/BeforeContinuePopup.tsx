import React from 'react';
import { AlertTriangle } from 'lucide-react';
import styles from '../confirmation-styled-comp/BeforeContinuePopup.module.css';

interface BeforeContinuePopupProps {
  onYesShowBallot: () => void;
  onNoTakeMeBack: () => void;
}

const BeforeContinuePopup: React.FC<BeforeContinuePopupProps> = ({
  onYesShowBallot,
  onNoTakeMeBack
}) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
      
        <div className={styles.iconContainer}>
          <AlertTriangle className={styles.warningIcon} strokeWidth={2} />
        </div>

       
        <h3 className={styles.title}>Before You Continue</h3>

      
        <p className={styles.question}>
          Is the <span className={styles.boldItalic}>'Identifiers for All Candidates'</span> page open in the SURTR Verify app on your computer?
        </p>

       
        <div className={styles.buttonContainer}>
          <button
            onClick={onYesShowBallot}
            className={styles.yesButton}
          >
            Yes, show my Personalized Ballot
          </button>

          <button
            onClick={onNoTakeMeBack}
            className={styles.noButton}
          >
            No, take me back
          </button>
        </div>
      </div>
    </div>
  );
};

export default BeforeContinuePopup;
