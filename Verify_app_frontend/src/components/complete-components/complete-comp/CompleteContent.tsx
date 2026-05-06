import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Info } from 'lucide-react';
import { ProgressSteps } from '@/components/preparation-components/preparation-comp';
import { getFinalResult, getCurrentAuthenticatedVoter, getVoterTriplets } from '@/utils/dataService';
import styles from '../complete-styled-comp/Complete.module.css';

const CompleteContent = () => {
  const navigate = useNavigate();
  const steps = ["Voting QR Code", "After Vote casting", "True Identifier", "Identifiers for All Candidates", "Complete"];

  
  const [voterTriplets, setVoterTriplets] = useState<Array<{tripletId: number, candidateName: string, emoji: string}>>([]);
  const [finalResult, setFinalResult] = useState<any>(null);
  useEffect(() => {
    const loadResult = async () => {
      const result = await getFinalResult();
      setFinalResult(result ?? []);
      console.log(result);
    }

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

    loadTriplets();
    loadResult();
  }, []);


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

        <div className={styles.tripletsBox}>
          <h3 className={styles.tripletsTitle}>Election Results</h3>
          {finalResult === null ? null : finalResult.length === 0 ? (
            <p>Election result not counted yet</p>
          ) : (
            <div className={styles.tripletsTable}>
              <div className={styles.electionHeaderRow}>
                <span className={styles.tripletsHeaderCell}>Candidate</span>
                <span className={styles.tripletsHeaderCell}>Votes</span>
              </div>
              {finalResult.map((entry: {candidateName: string, vote_count: number}, index: number) => (
                <div key={index} className={styles.electionRow}>
                  <span className={styles.tripletsCell}>{entry.candidateName}</span>
                  <span className={styles.tripletsCell}>{entry.vote_count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

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
      </div>
    </div>
  );
};

export default CompleteContent;
