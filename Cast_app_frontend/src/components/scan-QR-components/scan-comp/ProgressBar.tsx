import React from 'react';
import styles from '../scan-styled-comp/ProgressBar.module.css';

interface Step {
  number: number;
  label: string;
}

interface ProgressBarProps {
  currentStep?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep = 1 }) => {
  const steps: Step[] = [
    { number: 1, label: 'Scan QR' },
    { number: 2, label: 'Select Candidate' },
    { number: 3, label: 'Confirm Selection' },
    { number: 4, label: 'Voting Confirmation' },
    { number: 5, label: 'Personalized ballot' },
    { number: 6, label: 'Completed' },
  ];

  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressTrack}>
        {steps.map((step, index) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.number < currentStep;
          
          return (
            <div key={step.number} className={styles.stepWrapper}>
              <div className={styles.stepItem}>
                <div
                  className={`${styles.stepCircle} ${
                    isActive
                      ? styles.active
                      : isCompleted
                      ? styles.completed
                      : styles.inactive
                  }`}
                >
                  {step.number}
                </div>
                <div
                  className={`${styles.stepLabel} ${
                    isActive || isCompleted ? styles.activeLabel : styles.inactiveLabel
                  }`}
                >
                  {step.label}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`${styles.stepConnector} ${
                    isCompleted ? styles.connectorCompleted : styles.connectorInactive
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;
