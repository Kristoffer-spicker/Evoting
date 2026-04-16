import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ScanLine } from 'lucide-react';
import styles from '../scan-styled-comp/ScanQRContent.module.css';


const customScannerStyles = `
  #qr-scanner-container {
    border: none !important;
  }
  
  #qr-scanner-container video {
    border-radius: 8px !important;
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
  }
  
  #qr-scanner-container__dashboard {
    display: none !important;
  }
  
  #qr-scanner-container__camera_selection {
    display: none !important;
  }
  
  #qr-scanner-container__scan_region {
    border: none !important;
  }
  
  #qr-scanner-container__dashboard_section {
    display: none !important;
  }
  
  #qr-scanner-container__dashboard_section_csr {
    display: none !important;
  }
`;

interface ScanQRContentProps {
  onScanResult?: (result: string) => void;
  onCancel?: () => void;
}

const ScanQRContent: React.FC<ScanQRContentProps> = ({ 
  onScanResult,
  onCancel
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<'ready' | 'scanning' | 'error'>('ready');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const autoStart = async () => {
     
      await new Promise(resolve => setTimeout(resolve, 100));
      if (isMounted) {
        startScanning();
      }
    };

    autoStart();

    return () => {
      isMounted = false;
      isStartingRef.current = false;
    
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, []);

  const handleScanResult = async (decodedText: string) => {
    setIsScanning(false);
    setCameraStatus('ready');
    
  
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
     
      }
      scannerRef.current = null;
    }
    
    if (onScanResult) {
      onScanResult(decodedText);
    }
  };

  const handleScanFailure = (_error: string) => {
  
  };

  const handleCancel = async () => {
    setIsScanning(false);
    setCameraStatus('ready');
    
  
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
      
      }
      scannerRef.current = null;
    }
    
    if (onCancel) {
      onCancel();
    }
  };

  const startScanning = async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;

    try {
      setCameraStatus('scanning');
      setIsScanning(true);
      setErrorMessage('');

   
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (e) {
   
        }
        scannerRef.current = null;
      }

    
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this browser');
      }

  
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      stream.getTracks().forEach(track => track.stop());

     
      await new Promise(resolve => setTimeout(resolve, 500));

    
      scannerRef.current = new Html5Qrcode("qr-scanner-container");

      await scannerRef.current.start(
        { facingMode: "environment" },
        { 
          fps: 10,
          qrbox: { width: 300, height: 300 },
        },
        handleScanResult,
        handleScanFailure
      );
      
    
      const styleElement = document.createElement('style');
      styleElement.textContent = customScannerStyles;
      document.head.appendChild(styleElement);

      isStartingRef.current = false;
      
    } catch (error: any) {
      setCameraStatus('error');
      
      let errorMsg = 'Camera access failed';
      if (error.name === 'NotAllowedError') {
        errorMsg = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMsg = 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMsg = 'Camera not supported on this browser.';
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
      setIsScanning(false);
      isStartingRef.current = false;
    }
  };

  const renderCameraContent = () => {
    if (isScanning && cameraStatus === 'scanning') {
      return (
        <div 
          id="qr-scanner-container"
          className={styles.scannerContainerActive}
        />
      );
    }

    switch (cameraStatus) {
      case 'ready':
        return (
          <>
            <ScanLine className={styles.scanIcon} />
            <p className={styles.cameraStatus}>Ready to scan</p>
            <button 
              onClick={startScanning}
              className={styles.startCameraButton}
            >
              Start Camera
            </button>
          </>
        );
      case 'error':
        return (
          <>
            <ScanLine className={styles.scanIcon} />
            <p className={styles.cameraStatusError}>
              Scanner Error
            </p>
            <p className={styles.errorMessage}>
              {errorMessage || 'Scanner failed to start'}
            </p>
            <button 
              onClick={startScanning}
              className={styles.tryAgainButton}
            >
              Try Again
            </button>
          </>
        );
      default:
        return (
          <>
            <ScanLine className={styles.scanIcon} />
            <p className={styles.cameraStatus}>Loading...</p>
          </>
        );
    }
  };

  return (
    <div className={styles.mainContent}>
      <div className={styles.contentWrapper}>
    
        <h1 className={styles.pageHeader}>Scan QR Code</h1>

       
        <div className={styles.instructionsContainer}>
          <h3 className={styles.instructionTitle}>Instructions</h3>
          <p className={styles.instructionsText}>
            To proceed with vote casting, open the <strong>SURTR Verify</strong> app on your computer, display the QR code, and scan it using this scanner.
          </p>
        </div>

        <div className={styles.scannerContainer}>
        
          <div className={styles.scanHereText}>
            <p className={styles.scanText}>Scan here</p>
          </div>

          <div className={styles.scannerFrame}>
            <div className={styles.scannerBorder}>
            
              <div className={`${styles.cornerBracket} ${styles.topLeft}`}>
                <div className={`${styles.cornerLine} ${styles.cornerLineHorizontal} ${styles.topLeftHoriz}`}></div>
                <div className={`${styles.cornerLine} ${styles.cornerLineVertical} ${styles.topLeftVert}`}></div>
              </div>
              <div className={`${styles.cornerBracket} ${styles.topRight}`}>
                <div className={`${styles.cornerLine} ${styles.cornerLineHorizontal} ${styles.topRightHoriz}`}></div>
                <div className={`${styles.cornerLine} ${styles.cornerLineVertical} ${styles.topRightVert}`}></div>
              </div>
              <div className={`${styles.cornerBracket} ${styles.bottomLeft}`}>
                <div className={`${styles.cornerLine} ${styles.cornerLineHorizontal} ${styles.bottomLeftHoriz}`}></div>
                <div className={`${styles.cornerLine} ${styles.cornerLineVertical} ${styles.bottomLeftVert}`}></div>
              </div>
              <div className={`${styles.cornerBracket} ${styles.bottomRight}`}>
                <div className={`${styles.cornerLine} ${styles.cornerLineHorizontal} ${styles.bottomRightHoriz}`}></div>
                <div className={`${styles.cornerLine} ${styles.cornerLineVertical} ${styles.bottomRightVert}`}></div>
              </div>

             
              <div className={styles.cameraView}>
                {renderCameraContent()}
              </div>
            </div>
          </div>

          <div className={styles.alignmentText}>
            <p className={styles.alignText}>Align QR code inside the frame.</p>
          </div>
        </div>

       
        <div className={styles.buttonContainer}>
          <button
            onClick={handleCancel}
            className={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanQRContent;