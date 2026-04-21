import React from 'react'
import styles from '../landing-styled-comp/progressBar.module.css'

interface ProgressBarProps {
  phase?: string;
  steps?: string[];
  currentStep?: number;
}

export function ProgressBar({ 
  phase = "Phase 1 – Voter Registration", 
  steps = ["Welcome", "Register", "Read the Voting Guide", "See True Identifier"], 
  currentStep = 0 
}: ProgressBarProps): React.JSX.Element {

  return (
    <div className={styles.progressBar}>
      <div className={styles.progressContainer}>
    
        <div className={styles.phaseTitle}>
          {phase}
        </div>

       
        <div className={styles.stepsContainer}>
          {steps.map((step, index) => {
            const isActive = index === currentStep
            const isCompleted = index < currentStep
            const isLast = index === steps.length - 1

            return (
              <div key={index} className={isLast ? styles.stepWrapperLast : styles.stepWrapper}>
              
                <div className={styles.stepContent}>
                  <div className={`${styles.stepCircle} ${(isActive || isCompleted) ? styles.active : ''}`}>
                    {index + 1}
                  </div>
                  <div className={`${styles.stepLabel} ${(isActive || isCompleted) ? styles.activeLabel : ''}`}>
                    {step}
                  </div>
                </div>

               
                {!isLast && <div className={`${styles.connectorLine} ${isCompleted ? styles.connectorActive : ''}`} />}
              </div>
            )
          })}
        </div>

      
        <div className={styles.progressText}>
          {currentStep + 1}/{steps.length} Completed
        </div>
      </div>
    </div>
  )
}