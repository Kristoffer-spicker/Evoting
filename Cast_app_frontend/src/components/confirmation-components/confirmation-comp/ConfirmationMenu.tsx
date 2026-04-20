import React from 'react';
import { X, User, HelpCircle, LogOut } from 'lucide-react';
import styles from '../confirmation-styled-comp/ConfirmationMenu.module.css';

interface ConfirmationMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  voterId: string;
  onLogout: () => void;
  onVotingGuide: () => void;
}

const ConfirmationMenu: React.FC<ConfirmationMenuProps> = ({
  isOpen,
  onClose,
  userName,
  voterId,
  onLogout,
  onVotingGuide
}) => {
  const handleMenuAction = (action: () => void) => {
    action();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
     
      <div className={styles.overlay} onClick={onClose} />

     
      <div className={styles.menuPanel}>
       
        <div className={styles.menuHeader}>
          <h2 className={styles.menuTitle}>Menu</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close menu"
          >
            <X className={styles.closeIcon} />
          </button>
        </div>

     
        <div className={styles.menuItems}>
        
          <div className={styles.profileSection}>
            <div className={styles.profileItem}>
              <User className={styles.profileIcon} />
              <div className={styles.profileContent}>
                <span className={styles.profileLabel}>Profile</span>
                <div className={styles.profileInfo}>
                  <span className={styles.userName}>Name: {userName}</span>
                  <span className={styles.userId}>Voter ID Number: {voterId}</span>
                </div>
              </div>
            </div>
          </div>

          

         
          <button
            onClick={() => handleMenuAction(onVotingGuide)}
            className={styles.menuItem}
          >
            <HelpCircle className={styles.menuItemIcon} />
            <span className={styles.menuItemText}>Help & Guidance</span>
          </button>

        
          <button
            onClick={() => handleMenuAction(onLogout)}
            className={styles.menuItem}
          >
            <LogOut className={styles.menuItemIcon} />
            <span className={styles.menuItemText}>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default ConfirmationMenu;