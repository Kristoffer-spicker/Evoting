// Assembles all the QR Logic

import React from 'react';
import ProgressBar from './ProgressBar';
import ScanQRContent from './ScanQRContent';
import styles from '../scan-styled-comp/ScanQR.module.css';

interface ScanQRProps {
  onScanResult?: (result: string) => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
  headerComponent?: React.ReactNode;
}

const ScanQR: React.FC<ScanQRProps> = ({ 
  onScanResult,
  onCancel,
  headerComponent
}) => {
  return (
    <div className={styles.container}>
    
      {headerComponent}

      <ProgressBar currentStep={1} />

 
      <ScanQRContent 
        onScanResult={onScanResult}
        onCancel={onCancel}
      />
    </div>
  );
};

export default ScanQR;