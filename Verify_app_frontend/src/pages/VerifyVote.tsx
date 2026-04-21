import { VerifyVoteContent } from '../components/verify-vote-components/verify-vote-comp';
import { MainMenuNavigation } from '@/components/main-menu-components/main-menu-comp';
import styles from '../components/verify-vote-components/verify-vote-styled-comp/verifyVote.module.css';

const VerifyVote = () => {
  return (
    <div className={styles.page}>
      <MainMenuNavigation backPath="/complete" />
      <VerifyVoteContent />
    </div>
  );
};

export default VerifyVote;
