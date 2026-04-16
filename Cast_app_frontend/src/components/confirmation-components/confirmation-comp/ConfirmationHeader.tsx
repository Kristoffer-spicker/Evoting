import React from 'react';
import { Menu } from 'lucide-react';
import styles from '../confirmation-styled-comp/ConfirmationHeader.module.css';

interface ConfirmationHeaderProps {
  onMenuToggle: () => void;
}

const ConfirmationHeader: React.FC<ConfirmationHeaderProps> = ({ onMenuToggle }) => {
  return (
    <div className={styles.headerSection}>
      <div className={styles.headerContent}>
     
        <button
          onClick={onMenuToggle}
          className={styles.menuButton}
          aria-label="Open menu"
        >
          <Menu className={styles.menuIcon} />
        </button>

      
        <h1 className={styles.appName}>SURTR Vote</h1>
      </div>
    </div>
  );
};

export default ConfirmationHeader;