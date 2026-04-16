import React from 'react';
import styles from '../scan-styled-comp/ScanQRLayout.module.css';

interface ScanQRLayoutProps {
  children: React.ReactNode;
}

const ScanQRLayout: React.FC<ScanQRLayoutProps> = ({ children }) => {
  return (
    <div className={styles.pageContainer}>
      {children}
    </div>
  );
};

export default ScanQRLayout;