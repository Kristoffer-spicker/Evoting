import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import styles from '../confirmation-styled-comp/CompletionPopup.module.css';

interface CompletionPopupProps {
  onOK: () => void;
}

const CompletionPopup: React.FC<CompletionPopupProps> = ({ onOK }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
      
        <div className={styles.iconContainer}>
          <CheckCircle2 className={styles.successIcon} strokeWidth={2} />
        </div>
        
      
        <h3 className={styles.title}>
          Phase 2 — Vote Casting complete!
        </h3>
        
        <p className={styles.message}>
          You can verify your vote in Phase 3 — Vote Verification on the SURTR Verify app using your registration device.
        </p>
        
      
        <button
          onClick={onOK}
          className={styles.okButton}
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default CompletionPopup;