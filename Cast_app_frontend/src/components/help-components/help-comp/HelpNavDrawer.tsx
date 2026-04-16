import { X } from 'lucide-react';
import styles from '../help-styled-comp/helpNavDrawer.module.css';

interface Section {
  id: string;
  label: string;
}

interface HelpNavDrawerProps {
  isOpen: boolean;
  sections: Section[];
  activeSection: string;
  onSectionClick: (id: string) => void;
  onClose: () => void;
}

const HelpNavDrawer = ({ isOpen, sections, activeSection, onSectionClick, onClose }: HelpNavDrawerProps) => {
  const handleSectionClick = (id: string) => {
    onSectionClick(id);
    onClose();
  };

  return (
    <>
     
      {isOpen && (
        <div className={styles.overlay} onClick={onClose} />
      )}

    
      <div className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}>
        <div className={styles.drawerContent}>
          <div className={styles.drawerHeader}>
            <h2 className={styles.drawerTitle}>Sections</h2>
            <button
              onClick={onClose}
              className={styles.closeButton}
              aria-label="Close navigation"
            >
              <X className={styles.closeIcon} />
            </button>
          </div>
          <nav className={styles.nav}>
            <ul className={styles.navList}>
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => handleSectionClick(section.id)}
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
        </div>
      </div>
    </>
  );
};

export default HelpNavDrawer;
