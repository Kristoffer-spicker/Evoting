import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Ballot as BallotComponent, FinishVotingPopup } from '../components/ballot-components/ballot-comp';
import ConfirmationHeader from '../components/confirmation-components/confirmation-comp/ConfirmationHeader';
import ConfirmationMenu from '../components/confirmation-components/confirmation-comp/ConfirmationMenu';
import MinimalErrorPage from '../components/shared/MinimalErrorPage';
import { updateVoterConfirmationStatus, hasVoterConfirmed } from '../utils/dataService';

const Ballot: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFinishPopup, setShowFinishPopup] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  
  const selectedCandidate = location.state?.selectedCandidate || 'James Bond';
  const voterData = useMemo(() => ({
    userName: location.state?.userName || 'Voter',
    voterId: location.state?.voterId || '0000'
  }), [location.state?.userName, location.state?.voterId]);


  useEffect(() => {
    const checkConfirmationStatus = async () => {
      if (location.state?.voterId && location.state.voterId !== '0000') {
        const hasConfirmed = await hasVoterConfirmed(location.state.voterId);
        if (hasConfirmed) {
          setAccessDenied(true);
        }
      }
    };
    checkConfirmationStatus();
  }, [location.state?.voterId]);

  useEffect(() => {
    const handlePopState = () => {

      if (showFinishPopup) {
        setShowFinishPopup(false);

        window.history.pushState(null, '', window.location.pathname);
        return;
      }
      

      navigate('/', { replace: true });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate, showFinishPopup]);

  
  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    console.log('Logout clicked');
    navigate('/', { replace: true });
  };

  const handleVotingGuide = () => {
    navigate('/help');
  };

  const handleNext = () => {
    setShowFinishPopup(true);
  };

  const handleFinishVoting = async () => {
    try {
      await updateVoterConfirmationStatus(location.state?.voterId || '0000');

    } catch (error) {
      console.error('Error updating confirmation status:', error);
    }
    
    navigate('/aftervote', {
      state: {
        userName: location.state?.userName || 'Voter',
        voterId: location.state?.voterId || '0000',
        selectedCandidate
      }
    });
  };

  const handleReviewAgain = () => {
    setShowFinishPopup(false);
  };

  const handleCancel = () => {
    
    console.log('User cancelled ballot view');
    navigate('/castvote');
  };

  if (accessDenied) {
    return <MinimalErrorPage />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7FAFC', display: 'flex', flexDirection: 'column' }}>
      <BallotComponent 
        selectedCandidate={selectedCandidate}
        voterData={voterData}
        onNext={handleNext}
        onCancel={handleCancel}
        headerComponent={<ConfirmationHeader onMenuToggle={handleMenuToggle} />}
      />
      <ConfirmationMenu
        isOpen={isMenuOpen}
        onClose={handleMenuClose}
        userName={location.state?.userName || 'Voter'}
        voterId={location.state?.voterId || '0000'}
        onLogout={handleLogout}
        onVotingGuide={handleVotingGuide}
      />
      
      <FinishVotingPopup
        isVisible={showFinishPopup}
        onFinishVoting={handleFinishVoting}
        onReviewAgain={handleReviewAgain}
      />
    </div>
  );
};

export default Ballot;