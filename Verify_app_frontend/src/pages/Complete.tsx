import { CompleteContent } from '../components/complete-components/complete-comp';
import { MainMenuNavigation } from '@/components/main-menu-components/main-menu-comp';
import styles from '../components/complete-components/complete-styled-comp/Complete.module.css';

const Complete = () => {
  return (
    <div className={styles.completePage}>
      <MainMenuNavigation backPath="/" />
      <CompleteContent />
    </div>
  );
};

export default Complete;
