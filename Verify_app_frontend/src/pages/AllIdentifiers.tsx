import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';
import { AllIdentifiersContent } from '../components/all-identifiers-components/all-identifiers-comp';
import { MainMenuNavigation } from '@/components/main-menu-components/main-menu-comp';
import { hasVoterSeenAllIdentifiers, markAllIdentifiersSeen } from '@/utils/allIdentifiersEnforcement';
import styles from '../components/all-identifiers-components/all-identifiers-styled-comp/allIdentifiers.module.css';

const AllIdentifiers = () => {
  const navigate = useNavigate();
  const [accessError, setAccessError] = useState<string | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  
  const authenticatedVoter = localStorage.getItem('surtr_authenticated_voter');

 
  useEffect(() => {
    const checkAccess = async () => {
      try {
        if (!authenticatedVoter) {
          setAccessError('No authenticated voter found');
          setIsCheckingAccess(false);
          return;
        }

        const voter = JSON.parse(authenticatedVoter);
        
      
        const alreadySeen = await hasVoterSeenAllIdentifiers(voter.voterId);
        if (alreadySeen) {
          setAccessError('You have already seen all identifiers');
          setIsCheckingAccess(false);
          return;
        }

       
        setIsCheckingAccess(false);
      } catch (error) {
        console.error('Error checking all identifiers access:', error);
        setAccessError('Error checking access');
        setIsCheckingAccess(false);
      }
    };

    checkAccess();
  }, [authenticatedVoter]);

  
  const handleFinish = async () => {
    try {
      if (authenticatedVoter) {
        const voter = JSON.parse(authenticatedVoter);
        await markAllIdentifiersSeen(voter.voterId);
      }
    } catch (error) {
      console.error('Error marking all identifiers as seen:', error);
    }
    
   
    navigate('/complete');
  };

 
  if (isCheckingAccess) {
    return (
      <div className={styles.page}>
        <MainMenuNavigation showBackButton={false} />
        <div className={styles.contentWrapper}>
          <div className={styles.loadingText}>Loading...</div>
        </div>
      </div>
    );
  }

  
  if (accessError === 'You have already seen all identifiers') {
    return (
      <div className={styles.errorPageMinimal}>
        <div className={styles.errorMessageContainer}>
          <TriangleAlert className={styles.errorMessageIcon} />
          <span className={styles.errorMessageText}>This page is no longer accessible.</span>
        </div>
      </div>
    );
  }


  if (accessError) {
    return (
      <div className={styles.errorPageMinimal}>
        <div className={styles.errorMessageContainer}>
          <TriangleAlert className={styles.errorMessageIcon} />
          <span className={styles.errorMessageText}>{accessError}</span>
        </div>
      </div>
    );
  }

  
  return (
    <div className={styles.page}>
      <MainMenuNavigation showBackButton={false} />
      <div className={styles.contentWrapper}>
        <div className={styles.pageContainer}>
          <AllIdentifiersContent onFinish={handleFinish} />
        </div>
      </div>
    </div>
  );
};

export default AllIdentifiers;
