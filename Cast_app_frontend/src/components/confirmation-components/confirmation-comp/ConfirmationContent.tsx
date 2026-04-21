import React from 'react';
import { CheckCircle } from 'lucide-react';
import styles from '../confirmation-styled-comp/ConfirmationContent.module.css';

interface ConfirmationContentProps {
  chosenCandidate: string;
  onFinish: () => void;
}

const ConfirmationContent: React.FC<ConfirmationContentProps> = ({
  chosenCandidate,
  onFinish
}) => {
  return (
    <div className={styles.mainContent}>
     
      <div className={styles.scrollableContent}>
        <div className={styles.contentWrapper}>
        
          <h1 className={styles.pageHeader}>Voting Confirmation</h1>

         
          <div className={styles.successCard}>
            <div className={styles.successHeader}>
              <CheckCircle className={styles.successIcon} />
              <span className={styles.successText}>Your vote has been successfully cast</span>
            </div>
            <p className={styles.forText}>for</p>
            <p className={styles.candidateName}>{chosenCandidate}</p>
          </div>

       
          <div className={styles.nextStepCard}>
            <h2 className={styles.nextStepTitle}>Next Step</h2>
            <p className={styles.nextStepText}>
              In the next step, you will see your vote verification identifiers in the <strong>SURTR Verify</strong> app on your computer.
            </p>
          </div>

        
          <div className={styles.instructionsCard}>
            <h2 className={styles.instructionsTitle}>Complete the steps below before continuing here</h2>
            
            <div className={styles.stepsList}>
              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>1</div>
                <p className={styles.stepText}>Go to the <strong>SURTR Verify</strong> app on your computer now.</p>
              </div>
              
              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>2</div>
                <p className={styles.stepText}>
              Continue with the <strong>'After Vote Casting'</strong> step.
                </p>
              </div>
              
              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>3</div>
                <p className={styles.stepText}>
                
                View the <strong>'True Identifier'</strong> of your vote,  then continue to the <strong>'Identifiers for All Candidates'</strong> page.
                </p>
              </div>

              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>4</div>
                <p className={styles.stepText}>
              Keep the <strong>'Identifiers for All Candidates'</strong> page open, then come back here to <strong> Continue to Personalized Ballot</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

   
      <div className={styles.fixedBottomSection}>
        <div className={styles.bottomContainer}>
          <button
            onClick={onFinish}
            className={styles.continueButton}
          >
            Continue to <span className={styles.buttonItalic}>Personalized Ballot</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationContent;