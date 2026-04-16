import React from 'react'
import { TriangleAlert } from 'lucide-react'
import styles from '../true-identifier-styled-comp/trueIdentifier.module.css'

interface WarningPopupProps {
  onContinue: () => void
  onCancel: () => void
}

export function WarningPopup({ onContinue, onCancel }: WarningPopupProps): React.JSX.Element {
  return (
    <div className={styles.successOverlay}>
      <div className={styles.successModal}>
        <div className={styles.successContent}>
          <div className={styles.warningIconContainer}>
            <TriangleAlert className={styles.warningIcon} />
          </div>
          <h2 className={styles.warningTitle}>Cannot Return to This Page</h2>
          <p className={styles.warningDescription}>
            Once you continue, you will not be able to return to this page.
          </p>
          <p className={styles.warningInstruction}>
            Please make sure you have memorized your True Identifier before continuing.
          </p>
          <div className={styles.buttonContainer}>
            <button onClick={onContinue} className={styles.continueButton}>
              Continue
            </button>
            <button onClick={onCancel} className={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}