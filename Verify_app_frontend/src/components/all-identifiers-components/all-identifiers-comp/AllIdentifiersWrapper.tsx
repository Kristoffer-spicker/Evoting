import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';
import AllIdentifiersContent from './AllIdentifiersContent';
import { hasVoterSeenAllIdentifiers, markAllIdentifiersSeen } from '@/utils/allIdentifiersEnforcement';
import styles from '../all-identifiers-styled-comp/allIdentifiers.module.css';

const AllIdentifiersWrapper = () => {
  const navigate = useNavigate();
  const [accessError, setAccessError] = useState<string | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);


  useEffect(() => {
    const checkAccess = async () => {
      try {
        const authenticatedVoter = localStorage.getItem('surtr_authenticated_voter');
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
  }, []);

  const handleFinish = async () => {
    try {
      const authenticatedVoter = localStorage.getItem('surtr_authenticated_voter');
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
    return null;
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


  return <AllIdentifiersContent onFinish={handleFinish} />;
};

export default AllIdentifiersWrapper;
