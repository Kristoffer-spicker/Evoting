import React, { useState, useRef, useEffect } from 'react';
import ProgressBar from '../../scan-QR-components/scan-comp/ProgressBar';
import BallotContent from './BallotContent';
import { getBallotOrder } from '../../../utils';
import styles from '../ballot-styled-comp/Ballot.module.css';

interface BallotProps {
  selectedCandidate: string;
  voterData?: { voterId: string; userName: string };
  onNext?: () => void;
  onCancel?: () => void;
  onBallotOrderCreated?: (ballotOrder: string[]) => void;
  headerComponent?: React.ReactNode;
}

const Ballot: React.FC<BallotProps> = ({ 
  voterData,
  onNext,
  onBallotOrderCreated,
  headerComponent
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const candidateRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [ballotCandidates, setBallotCandidates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ballotError, setBallotError] = useState(false);
  const ballotProcessedRef = useRef(false);

  
  useEffect(() => {
    const loadBallot = async () => {
    
      if (ballotProcessedRef.current) {
        return;
      }
      ballotProcessedRef.current = true;
      
      try {
      
        if (voterData?.voterId && voterData.voterId !== '0000') {
          const existingBallot = await getBallotOrder(voterData.voterId);
          
          if (existingBallot && existingBallot.ballotList && existingBallot.ballotList.length > 0) {
          
            setBallotCandidates(existingBallot.ballotList);
            console.log('Loaded existing ballot for voter:', voterData.voterId);
          } else {
           
            console.error('No ballot found for voter:', voterData.voterId);
            setBallotCandidates([]);
            setBallotError(true);
          }
        } else {
         
          console.error('Invalid voter data - cannot load ballot');
          setBallotCandidates([]);
          setBallotError(true);
        }
      } catch (error) {
        console.error('Error loading ballot:', error);
        setBallotCandidates([]);
        setBallotError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (voterData?.voterId) {
      loadBallot();
    }
  }, [voterData?.voterId]);

 
  React.useEffect(() => {
    if (onBallotOrderCreated && ballotCandidates.length > 0 && !isLoading) {
      console.log('Ballot component order ready:', ballotCandidates);
      onBallotOrderCreated(ballotCandidates);
    }
  }, [ballotCandidates, onBallotOrderCreated, isLoading]);

  const handleFind = () => {
    if (!searchQuery.trim()) return;

    const index = ballotCandidates.findIndex(
      (candidate) =>
        candidate.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (index !== -1) {
      setHighlightedIndex(index);
     
      candidateRefs.current[index]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

     
      setTimeout(() => {
        setHighlightedIndex(null);
      }, 3000);
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
    }
  };

 
  if (isLoading) {
    return (
      <div className={styles.container}>
      
        {headerComponent}

      
        <ProgressBar currentStep={5} />

       
        <div className={styles.loadingMessage}>
          Loading ballot...
        </div>
      </div>
    );
  }


  if (ballotError || ballotCandidates.length === 0) {
    return (
      <div className={styles.container}>
    
        {headerComponent}

      
        <ProgressBar currentStep={5} />

       
        <div className={styles.errorMessage}>
          <p>Ballot not found.</p>
          <p>Please complete the voting process properly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
    
      {headerComponent}

    
      <ProgressBar currentStep={5} />

    
      <BallotContent 
        ballotCandidates={ballotCandidates}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFind={handleFind}
        highlightedIndex={highlightedIndex}
        candidateRefs={candidateRefs}
        onNext={handleNext}
      />
    </div>
  );
};

export default Ballot;