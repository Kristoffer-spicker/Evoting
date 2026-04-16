import React from 'react';
import { ProgressSteps } from './ProgressSteps';
import styles from '../preparation-styled-comp/preparation.module.css';

interface PreparationProps {
  onNext?: () => void;
}

const Preparation: React.FC<PreparationProps> = ({ onNext }) => {
  const steps = ["Get Ready", "View QR Code", "After Vote casting", "True Identifier", "Identifiers for All Candidates", "Complete"];

  const handleViewQRCode = () => {
    if (onNext) {
      onNext();
    }
  };

  return (
    <div className={styles.preparationPage}>
   
      <div className={styles.contentWrapper}>
        <div className={styles.container}>
      
          <ProgressSteps currentStep={1} steps={steps} />

       
          <div className={styles.mainCard}>
          
            <h1 className={styles.mainTitle}>Get ready to start the voting process</h1>

          
            <div className={styles.instructionBox}>
              <h2 className={styles.instructionTitle}>Instructions</h2>
              <p className={styles.instructionText}>
                In the next step, this app will show you a QR code.
              </p>
              <p className={styles.instructionText}>
                You must scan the QR code using the <strong>SURTR Vote App</strong> to be able to cast your vote.
              </p>
            </div>

           
            <div className={styles.stepsSection}>
              <h2 className={styles.stepsTitle}>Please complete the steps below before continuing</h2>
              
              <div className={styles.stepsList}>
                <div className={styles.stepItem}>
                  <div className={styles.stepNumber}>1</div>
                  <p className={styles.stepText}>
                    Open the <strong>SURTR Vote</strong> App on your phone
                  </p>
                </div>
                
                <div className={styles.stepItem}>
                  <div className={styles.stepNumber}>2</div>
                  <p className={styles.stepText}>
                    Log in using your voter information
                  </p>
                </div>
                
                <div className={styles.stepItem}>
                  <div className={styles.stepNumber}>3</div>
                  <p className={styles.stepText}>
                    Return to this app to view the QR code
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.buttonContainer}>
              <button
                onClick={handleViewQRCode}
                className={styles.viewQRButton}
              >
                View My QR Code
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preparation;