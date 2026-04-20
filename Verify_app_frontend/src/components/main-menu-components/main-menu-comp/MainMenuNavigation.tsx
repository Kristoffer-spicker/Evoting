import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import profileIcon from '../../../assets/icons/profile.svg';
import styles from '../main-menu-styled-comp/mainMenuNavigation.module.css';

interface MainMenuNavigationProps {
  backPath?: string;
  showBackButton?: boolean;
}

const MainMenuNavigation = ({ backPath, showBackButton = true }: MainMenuNavigationProps) => {
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

 
  const authenticatedVoter = localStorage.getItem('surtr_authenticated_voter');
  const userData = authenticatedVoter ? JSON.parse(authenticatedVoter) : null;

  const handleLogout = () => {
    localStorage.removeItem('surtr_authenticated_voter')
    setShowProfileDropdown(false)
    navigate('/login')
  }

  const handleProfileClick = () => {
    setShowProfileDropdown(!showProfileDropdown)
  }

  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false)
      }
    }

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileDropdown])

  return (
    <nav className={styles.navigation}>
      <div className={styles.container}>
        <div className={styles.leftSection}>
          {showBackButton && (
            <button onClick={() => navigate(backPath || '/landing')} className={styles.backButton}>
              <ArrowLeft className={styles.backIcon} />
            </button>
          )}
          <span className={styles.title}>SURTR Verify</span>
          
        </div>
        
        <div className={styles.rightSection}>
          <div className={styles.profileContainer} ref={dropdownRef}>
          <button onClick={handleProfileClick} className={`${styles.profileButton} ${showProfileDropdown ? styles.profileButtonActive : ''}`}>
            <img src={profileIcon} alt="Profile" className={styles.profileIcon} />
          </button>
          
          {showProfileDropdown && (
            <div className={styles.profileDropdown}>
              <div className={styles.userInfo}>
                <div className={styles.userNameText}>
                  Name: {userData?.name || 'Unknown'}
                </div>
                <div className={styles.voteIdText}>
                  Voter-ID Number: {userData?.voterId || 'Unknown'}
                </div>
              </div>
              <button onClick={handleLogout} className={styles.logoutOption}>
                Logout
              </button>
            </div>
          )}
          </div>
          <button onClick={() => navigate('/help')} className={styles.helpButton}>
            <HelpCircle className={styles.helpIcon} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default MainMenuNavigation;
