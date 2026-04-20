import React from 'react';
import BallotHeader from './BallotHeader';
import BallotInfoBox from './BallotInfoBox';
import InstructionExampleContainer from './InstructionExampleContainer';
import SearchSection from './SearchSection';
import BallotList from './BallotList';

import styles from '../ballot-styled-comp/BallotContent.module.css';

interface BallotContentProps {
  ballotCandidates: string[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFind: () => void;
  highlightedIndex: number | null;
  candidateRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  onNext: () => void;
}

const BallotContent: React.FC<BallotContentProps> = ({
  ballotCandidates,
  searchQuery,
  onSearchChange,
  onFind,
  highlightedIndex,
  candidateRefs,
  onNext
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onFind();
    }
  };

  return (
    <div className={styles.mainContent}>
     
      <div className={styles.scrollableContent}>
        <div className={styles.contentWrapper}>
        
          <BallotHeader />

         
          <BallotInfoBox />

         
        <InstructionExampleContainer />

         
          <SearchSection
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onFind={onFind}
            onKeyPress={handleKeyPress}
          />

         
          <BallotList
            ballotCandidates={ballotCandidates}
            highlightedIndex={highlightedIndex}
            candidateRefs={candidateRefs}
          />
        </div>
      </div>

      
      <div className={styles.fixedBottomSection}>
        <div className={styles.bottomContainer}>
          <button
            onClick={onNext}
            className={styles.nextButton}
          >
           Complete Voting Process
          </button>
        </div>
      </div>
    </div>
  );
};

export default BallotContent;