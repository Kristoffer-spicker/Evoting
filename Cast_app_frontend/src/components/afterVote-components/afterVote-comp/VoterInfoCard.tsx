import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import styles from '../afterVote-styled-comp/VoterInfoCard.module.css';

interface VoterInfoCardProps {
  voterName: string;
}

const VoterInfoCard: React.FC<VoterInfoCardProps> = ({ voterName }) => {
  return (
    <div className={styles.card}>
     
      <div className={styles.iconContainer}>
        <CheckCircle2 className={styles.successIcon} strokeWidth={2} />
      </div>

      
      <div className={styles.contentContainer}>
        <p className={styles.greeting}>
          Hello, <span className={styles.voterName}>{voterName}</span>.
        </p>
        
        <p className={styles.completionMessage}>
          You have already completed casting your vote successfully.
        </p>
        
        <p className={styles.verificationInfo}>
          You can verify your vote during <span className={styles.phaseEmphasis}>"Phase-3: Vote Verification"</span> using the SURTR Verify app on the other device you used for voter registration.
        </p>
        
        <p className={styles.resultInfo}>
          Please check the election authority's official website to see when the results will be published.
        </p>
        
        <p className={styles.thankYou}>
          Thank you.
        </p>
      </div>
    </div>
  );
};

export default VoterInfoCard;