import React from 'react';
import styles from '../afterVote-styled-comp/AfterVoteComponents.module.css';

interface DoneButtonProps {
  onClick: () => void;
}

const DoneButton: React.FC<DoneButtonProps> = ({ onClick }) => {
  return (
    <div className={styles.doneButtonContainer}>
      <button className={styles.doneButton} onClick={onClick}>
        Close
      </button>
    </div>
  );
};

export default DoneButton;
