import React, { useState } from 'react';
import ProgressBar from '../../scan-QR-components/scan-comp/ProgressBar.tsx';
import CastVoteContent from './CastVoteContent.tsx';
import styles from '../cast-vote-styled-comp/CastVote.module.css';

interface CastVoteProps {
  onVoteSubmit?: (candidate: string) => void;
  onCancel?: () => void;
  errorMessage?: string | null;
  headerComponent?: React.ReactNode;
  candidates?: {id: number, name: string}[];
}

const CastVote: React.FC<CastVoteProps> = ({
  onVoteSubmit,
  onCancel,
  errorMessage,
  headerComponent,
  candidates = []
}) => {
  // Tracks which candidate the voter has currently selected
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');

  const parties = [
    {
      name: 'Candidates',
      candidates: candidates.map(c => c.name),
    },
  ];

  // Handles that yur not submitting an empty vote 
  // and that there is a handler provided 
  const handleVote = () => {
    if (selectedCandidate && onVoteSubmit) {
      onVoteSubmit(selectedCandidate);
    }
  };
  

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className={styles.container}>
     
      {headerComponent}

     
      <ProgressBar currentStep={2} />

     
      <CastVoteContent 
        parties={parties}
        selectedCandidate={selectedCandidate}
        onCandidateSelect={setSelectedCandidate}
        onVote={handleVote}
        onCancel={handleCancel}
        errorMessage={errorMessage}
      />
    </div>
  );
};

export default CastVote;