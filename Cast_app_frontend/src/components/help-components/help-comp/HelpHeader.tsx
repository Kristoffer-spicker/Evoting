import { ArrowLeft, Menu } from 'lucide-react';
import styles from '../help-styled-comp/helpHeader.module.css';

interface HelpHeaderProps {
  onBackClick: () => void;
  onMenuClick: () => void;
}

const HelpHeader = ({ onBackClick, onMenuClick }: HelpHeaderProps) => {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <button
          onClick={onBackClick}
          className={styles.backButton}
          aria-label="Go back"
        >
          <ArrowLeft className={styles.backIcon} />
        </button>
        <h1 className={styles.title}>Help & Guidance</h1>
        <button
          onClick={onMenuClick}
          className={styles.menuButton}
          aria-label="Open navigation"
        >
          <Menu className={styles.menuIcon} />
        </button>
      </div>
    </header>
  );
};

export default HelpHeader;
