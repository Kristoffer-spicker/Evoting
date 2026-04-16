import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ProgressSteps } from '@/components/preparation-components/preparation-comp';
import styles from '../qr-code-styled-comp/qrCodeContent.module.css';

const QRCodeContent = () => {
  const navigate = useNavigate();
  const steps = ["Voting QR Code", "After Vote casting", "True Identifier", "Identifiers for All Candidates", "Complete"];
  

  const authenticatedVoter = localStorage.getItem('surtr_authenticated_voter');
  const userData = authenticatedVoter ? JSON.parse(authenticatedVoter) : null;
  const qrValue = userData ? `SURTR-${userData.voterId}` : "SURTR Verify";

  const handleScannedQRCode = () => {
    navigate('/main-menu');
  };

  return (
    <div className={styles.contentWrapper}>
      <div className={styles.container}>
       
        <ProgressSteps currentStep={1} steps={steps} />

      
        <div className={styles.mainCard}>
         
          <h1 className={styles.mainTitle}>Voting QR Code</h1>

       
          <div className={styles.instructionBox}>
            <div className={styles.instructionContent}>
              <h2 className={styles.instructionTitle}>Instructions</h2>
              <p className={styles.instructionText}>
                To proceed with vote casting, use the <strong>SURTR Vote </strong> app on your phone:
              </p>
              <div className={styles.stepsList}>
                <div className={styles.stepItem}>
                  <div className={styles.stepNumber}>1</div>
                  <p className={styles.stepText}>Open the <strong>SURTR Vote</strong> app on your phone</p>
                </div>
                <div className={styles.stepItem}>
                  <div className={styles.stepNumber}>2</div>
                  <p className={styles.stepText}>Log in to your account using your voter information</p>
                </div>
                <div className={styles.stepItem}>
                  <div className={styles.stepNumber}>3</div>
                  <p className={styles.stepText}>Scan the QR code shown on the right</p>
                </div>
                <div className={styles.stepItem}>
                  <div className={styles.stepNumber}>4</div>
                  <p className={styles.stepText}>Cast your vote in the <strong>SURTR Vote</strong> app</p>
                </div>
              </div>
            </div>
            <div className={styles.qrSection}>
              <div className={styles.qrCodeContainer}>
                <QRCodeSVG 
                  value={qrValue}
                  size={120}
                  level="H"
                />
              </div>
              <p className={styles.scanText}>Scan this QR code</p>
            </div>
          </div>

        
          <div className={styles.buttonContainer}>
            <button
              onClick={handleScannedQRCode}
              className={styles.scannedButton}
            >
             Continue to After Vote Casting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeContent;
