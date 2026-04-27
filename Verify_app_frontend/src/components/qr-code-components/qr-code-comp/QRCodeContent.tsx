import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
//import { QRCodeSVG } from 'qrcode.react';
import { ProgressSteps } from '@/components/preparation-components/preparation-comp';
import styles from '../qr-code-styled-comp/qrCodeContent.module.css';
import { send } from 'process';

interface LocationState {
  voterId?: string;
}
interface QRResponse {
  qr_code: string;
}

async function genQR(voterID: string): Promise<QRResponse> {
    const url = (import.meta as any).env.VITE_API_URL;
    
    const response = await fetch(`${url}/qrcode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ voter_id: voterID }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate QR: ${response.status}`);
    }

    const data: QRResponse = await response.json();
    return data;
  }

const QRCodeContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const steps = ["Voting QR Code", "After Vote casting", "True Identifier", "Identifiers for All Candidates", "Complete"];
  
  const state = location.state as LocationState;
  const voterId = state?.voterId || '0000';

  const [qrCode, setQrCode] = useState<string>("");
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    genQR(voterId)
      .then(data => setQrCode(data.qr_code))
      .catch(err => console.error(err));
  }, []);
;

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
                {qrCode && (
                  <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" />
                )}
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
