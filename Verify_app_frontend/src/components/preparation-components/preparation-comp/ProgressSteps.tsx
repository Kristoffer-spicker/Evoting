import React from 'react'
import styles from '../preparation-styled-comp/progressSteps.module.css'

interface ProgressStepsProps {
  currentStep: number
  steps: string[]
}

export function ProgressSteps({ currentStep, steps }: ProgressStepsProps): React.JSX.Element {
  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressSteps}>
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === currentStep
          const isCompleted = stepNumber < currentStep
          
          return (
            <div key={stepNumber} className={styles.stepWrapper}>
              <div className={styles.stepItem}>
                <div 
                  className={`${styles.stepCircle} ${
                    isActive ? styles.active : isCompleted ? styles.completed : styles.inactive
                  }`}
                >
                  {stepNumber}
                </div>
                <div className={styles.stepLabel}>{step}</div>
              </div>
              {index < steps.length - 1 && (
                <div 
                  className={`${styles.stepConnector} ${
                    isCompleted ? styles.connectorCompleted : styles.connectorIncomplete
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
