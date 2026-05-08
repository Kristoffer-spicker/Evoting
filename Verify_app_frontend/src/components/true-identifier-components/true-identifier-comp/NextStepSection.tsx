import React from 'react'
import { Info } from 'lucide-react'
import styles from '../true-identifier-styled-comp/nextStepSection.module.css'

interface NextStepSectionProps {
  onContinue: () => void
}

export function NextStepSection({ onContinue }: NextStepSectionProps): React.JSX.Element {
  return (
    <>
      <div className={styles.nextStepCard}>
        <div className={styles.nextStepHeader}>
          <Info className={styles.nextStepIcon} />
          <h3 className={styles.nextStepTitle}>Next step</h3>
        </div>
        
        <div className={styles.nextStepContent}>
          <p className={styles.nextStepDescription}>
            Next, the QR code to cast your vote will be shown.
          </p>
          
          <p className={styles.nextStepInstruction}>
            Make sure you have memorized your True Identifier before continuing.
          </p>
          
          <p className={styles.nextStepWarning}>
            This page cannot be viewed again once you leave it.
          </p>
        </div>
      </div>
      
      <div className={styles.buttonContainer}>
        <button onClick={onContinue} className={styles.continueButton}>
          Continue to QR Code
        </button>
      </div>
    </>
  )
}