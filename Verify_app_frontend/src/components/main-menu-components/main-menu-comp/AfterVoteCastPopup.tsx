import React from 'react'
import { TriangleAlert } from 'lucide-react'
import styles from '../main-menu-styled-comp/afterVoteCastPopup.module.css'

interface AfterVoteCastPopupProps {
  onConfirm: () => void
  onCancel: () => void
}

export function AfterVoteCastPopup({ onConfirm, onCancel }: AfterVoteCastPopupProps): React.JSX.Element {
  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
       
        <div className={styles.iconContainer}>
          <TriangleAlert className={styles.warningIcon} />
        </div>

      
        <p className={styles.message}>
          You can view the True Identifier only once.
        </p>
        
        <p className={styles.question}>
          Do you want to continue?
        </p>

       
        <div className={styles.buttonContainer}>
          <button
            onClick={onConfirm}
            className={styles.confirmButton}
          >
            View True Identifier
          </button>
          
          <button
            onClick={onCancel}
            className={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}