import styles from '../verify-vote-styled-comp/candidateIdentifierModal.module.css';

interface CandidateIdentifier {
  id: string;
  candidate: string;
  emoji: string;
  word: string;
}

interface CandidateIdentifierModalProps {
  candidateIdentifier: CandidateIdentifier;
  onClose: () => void;
}

const CandidateIdentifierModal = ({ candidateIdentifier, onClose }: CandidateIdentifierModalProps) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
        <div className={styles.modalBody}>
          <p className={styles.modalCandidate}>
            Candidate name: {candidateIdentifier.candidate}
          </p>
          <p className={styles.modalIdent}>
            Identifier:
          </p>
          <div className={styles.modalIdentifier}>
            <div className={styles.modalEmoji}>{candidateIdentifier.emoji}</div>
            <div className={styles.modalWord}>{candidateIdentifier.word}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateIdentifierModal;