import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProgressBar from '../components/scan-QR-components/scan-comp/ProgressBar';
import ConfirmationHeader from '../components/confirmation-components/confirmation-comp/ConfirmationHeader';
import ConfirmationMenu from '../components/confirmation-components/confirmation-comp/ConfirmationMenu';
import ConfirmationContent from '../components/confirmation-components/confirmation-comp/ConfirmationContent';
import BeforeContinuePopup from '../components/confirmation-components/confirmation-comp/BeforeContinuePopup';
import MinimalErrorPage from '../components/shared/MinimalErrorPage';
import { hasVoterConfirmed } from '../utils/dataService';

interface LocationState {
  selectedCandidate: string;
  userName?: string;
  voterId?: string;
}

const Confirmation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  
  const state = location.state as LocationState;
  const chosenCandidate = state?.selectedCandidate || 'Unknown';
  const userName = state?.userName || 'Voter';
  const voterId = state?.voterId || '0000';

  useEffect(() => {
    const checkConfirmationStatus = async () => {
      if (voterId && voterId !== '0000') {
        const hasConfirmed = await hasVoterConfirmed(voterId);
        if (hasConfirmed) {
          setAccessDenied(true);
        }
      }
    };
    checkConfirmationStatus();
  }, [voterId]);

  const handleFinish = () => {

    console.log('Showing before continue popup for:', chosenCandidate);
    setShowCompletionPopup(true);
  };

  const handleYesShowBallot = () => {

    setShowCompletionPopup(false);
    navigate('/ballot', {
      state: {
        userName,
        voterId,
        selectedCandidate: chosenCandidate
      }
    });
  };

  const handleNoTakeMeBack = () => {

    setShowCompletionPopup(false);
  };

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


  if (accessDenied) {
    return <MinimalErrorPage />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7FAFC', display: 'flex', flexDirection: 'column' }}>
      <ConfirmationHeader onMenuToggle={handleMenuToggle} />
      
      <ProgressBar currentStep={4} />
      
      <ConfirmationMenu
        isOpen={isMenuOpen}
        onClose={handleMenuClose}
        userName={userName}
        voterId={voterId}
        onLogout={handleLogout}
        onVotingGuide={handleVotingGuide}
      />
      
      <ConfirmationContent 
        chosenCandidate={chosenCandidate}
        onFinish={handleFinish}
      />
      
      {showCompletionPopup && (
        <BeforeContinuePopup 
          onYesShowBallot={handleYesShowBallot}
          onNoTakeMeBack={handleNoTakeMeBack}
        />
      )}
    </div>
  );
};

export default Confirmation;