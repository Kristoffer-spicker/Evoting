import React, { useState } from 'react';
import ProgressBar from '../../scan-QR-components/scan-comp/ProgressBar.tsx';
import CastVoteContent from './CastVoteContent.tsx';
import styles from '../cast-vote-styled-comp/CastVote.module.css';

interface CastVoteProps {
  onVoteSubmit?: (candidate: string) => void;
  onCancel?: () => void;
  errorMessage?: string | null;
  headerComponent?: React.ReactNode;
}

const CastVote: React.FC<CastVoteProps> = ({ 
  onVoteSubmit,
  onCancel,
  errorMessage,
  headerComponent
}) => {
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');

  const parties = [
    {
      name: 'Party 1 "Movie Stars"',
      candidates: ["James Bond", "Tony Stark", "Jack Sparrow", "Ellen Ripley"],
    },
    {
      name: 'Party 2 "Comedy Stars"',
      candidates: ["Mr. Bean", "Homer Simpson", "Charlie Chaplin", "Peter Sellers"],
    },
    {
      name: 'Party 3 "Drama Stars"',
      candidates: ["Raymond Reddington", "Daenerys Targaryen", "Rachel Green", "Walter White"],
    },
  ];

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