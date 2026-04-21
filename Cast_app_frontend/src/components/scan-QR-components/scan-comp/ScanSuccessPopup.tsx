import React from 'react';
import { CheckCircle } from 'lucide-react';
import styles from '../scan-styled-comp/ScanSuccessPopup.module.css';

interface ScanSuccessPopupProps {
  isVisible: boolean;
  onContinue: () => void;
  onCancel: () => void;
}

const ScanSuccessPopup: React.FC<ScanSuccessPopupProps> = ({
  isVisible,
  onContinue,
  onCancel
}) => {
  if (!isVisible) return null;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
      
        <div className={styles.iconContainer}>
          <CheckCircle className={styles.successIcon} />
        </div>

      
        <h2 className={styles.heading}>QR scanned successfully!</h2>

        <p className={styles.subheading}>Next: Select candidate</p>

       
        <button
          onClick={onContinue}
          className={styles.proceedButton}
        >
          Proceed to Candidate Selection
        </button>
      </div>
    </div>
  );
};

export default ScanSuccessPopup;