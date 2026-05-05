import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Info } from 'lucide-react';
import { ProgressSteps } from '@/components/preparation-components/preparation-comp';
import { areElectionResultsPublished, getCurrentAuthenticatedVoter, getVoterTriplets } from '@/utils/dataService';
import styles from '../complete-styled-comp/Complete.module.css';

const CompleteContent = () => {
  const navigate = useNavigate();
  const steps = ["Voting QR Code", "After Vote casting", "True Identifier", "Identifiers for All Candidates", "Complete"];

  
  const [resultsPublished, setResultsPublished] = useState<boolean>(false);
  const [voterTriplets, setVoterTriplets] = useState<Array<{tripletId: number, candidateName: string, emoji: string}>>([]);

  useEffect(() => {
    const checkResultsStatus = async () => {
      try {
        const published = await areElectionResultsPublished();
        setResultsPublished(published);
      } catch (error) {
        console.error('Error checking results status:', error);
        setResultsPublished(false);
      }
    };

    const loadTriplets = async () => {
      try {
        const voter = getCurrentAuthenticatedVoter();
        if (!voter) return;
        const triplets = await getVoterTriplets(voter.voterId);
        setVoterTriplets(triplets);
      } catch {
        // triplets not available yet — leave empty
      }
    };

    checkResultsStatus();
    loadTriplets();
  }, []);

  const handleVerifyVote = () => {
    navigate('/verify-vote');
  };

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div className={styles.contentWrapper}>
      <div className={styles.pageContainer}>
     
        <ProgressSteps currentStep={5} steps={steps} />

        {voterTriplets.length > 0 && (
          <div className={styles.tripletsBox}>
            <h3 className={styles.tripletsTitle}>Your Triplets</h3>
            <div className={styles.tripletsTable}>
              <div className={styles.tripletsHeaderRow}>
                <span className={styles.tripletsHeaderCell}>ID</span>
                <span className={styles.tripletsHeaderCell}>Candidate</span>
                <span className={styles.tripletsHeaderCell}>Emoji</span>
              </div>
              {voterTriplets.map((triplet) => (
                <div key={triplet.tripletId} className={styles.tripletsRow}>
                  <span className={styles.tripletsCell}>{triplet.tripletId}</span>
                  <span className={styles.tripletsCell}>{triplet.candidateName}</span>
                  <span className={styles.tripletsCellEmoji}>{triplet.emoji}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.successCard}>
          <div className={styles.successContent}>
            <div className={styles.successIcon}>
              <CheckCircle size={30} strokeWidth={2} />
            </div>
            <p className={styles.successText}>
              You have successfully completed all steps of the voting process.
            </p>
          </div>
        </div>

    
        <div className={styles.nextStepCard}>
          <h2 className={styles.nextStepTitle}>Next Step</h2>
          
          <p className={styles.nextStepText}>
            {resultsPublished 
              ? <>Vote verification is available now. To verify your vote, click the <strong>Verify My Vote</strong> button below.</>
              : <>You can verify your vote from this page when the election results are published.</>
            }
          </p>

          <button 
            className={`${styles.verifyButton} ${resultsPublished ? styles.verifyButtonEnabled : styles.verifyButtonDisabled}`}
            onClick={handleVerifyVote}
            disabled={!resultsPublished}
          >
            Verify My Vote
          </button>


          {!resultsPublished && (
            <div className={styles.infoSection}>
              <Info size={20} className={styles.infoIcon} />
              <p className={styles.infoText}>
                Vote verification will be available after the election results are published.
              </p>
            </div>
          )}

         
          <button className={styles.closeButton} onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompleteContent;
