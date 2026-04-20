import { ArrowLeft } from 'lucide-react';
import styles from '../help-styled-comp/helpSidebar.module.css';

interface Section {
  id: string;
  label: string;
}

interface HelpSidebarProps {
  sections: Section[];
  activeSection: string;
  onSectionClick: (id: string) => void;
  onBackClick: () => void;
}

const HelpSidebar = ({ sections, activeSection, onSectionClick, onBackClick }: HelpSidebarProps) => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <button onClick={onBackClick} className={styles.backButton}>
          <ArrowLeft className={styles.backIcon} />
        </button>
        <h1 className={styles.title}>Help & Guidance</h1>
      </div>
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {sections.map((section) => (
            <li key={section.id}>
              <button
                onClick={() => onSectionClick(section.id)}
                className={`${styles.navButton} ${
                  activeSection === section.id ? styles.navButtonActive : ''
                }`}
              >
                {section.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default HelpSidebar;
