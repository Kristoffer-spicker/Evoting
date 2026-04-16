import React from 'react';
import { AlertTriangle } from 'lucide-react';
import styles from './MinimalErrorPage.module.css';

const MinimalErrorPage: React.FC = () => {
  return (
    <div className={styles.errorPageMinimal}>
      <div className={styles.errorMessageContainer}>
        <AlertTriangle className={styles.errorMessageIcon} />
        <span className={styles.errorMessageText}>This page is no longer accessible.</span>
      </div>
    </div>
  );
};

export default MinimalErrorPage;
