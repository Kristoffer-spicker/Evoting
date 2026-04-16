import React from 'react';
import styles from '../ballot-styled-comp/BallotList.module.css';

interface BallotListProps {
  ballotCandidates: string[];
  highlightedIndex: number | null;
  candidateRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}

const BallotList: React.FC<BallotListProps> = ({
  ballotCandidates,
  highlightedIndex,
  candidateRefs
}) => {
  return (
    <div className={styles.ballotContainer}>
      <h3 className={styles.ballotTitle}>Your Personalized Ballot</h3>
      <div className={styles.candidatesList}>
        {ballotCandidates.map((candidate, index) => (
          <div
            key={index}
            ref={(el) => (candidateRefs.current[index] = el)}
            className={`${styles.candidateItem} ${
              index === 0
                ? styles.candidateItemSelected
                : highlightedIndex === index
                ? styles.candidateItemHighlighted
                : styles.candidateItemDefault
            }`}
          >
            <div
              className={`${styles.positionNumber} ${
                index === 0
                  ? styles.positionNumberSelected
                  : styles.positionNumberDefault
              }`}
            >
              <span className={styles.numberText}>{index + 1}</span>
            </div>
            <div className={styles.candidateInfo}>
              <p className={styles.candidateName}>{candidate}</p>
             
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BallotList;