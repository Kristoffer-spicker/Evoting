import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProgressBar from '../components/scan-QR-components/scan-comp/ProgressBar';
import ConfirmationHeader from '../components/confirmation-components/confirmation-comp/ConfirmationHeader';
import ConfirmationMenu from '../components/confirmation-components/confirmation-comp/ConfirmationMenu';
import AfterVoteContent from '../components/afterVote-components/afterVote-comp/AfterVoteContent';

interface LocationState {
  userName?: string;
  voterId?: string;
}

const AfterVote: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const state = location.state as LocationState;
  const userName = state?.userName || 'Voter';
  const voterId = state?.voterId || '0000';

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

  const handleDone = () => {
    navigate('/', { replace: true });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7FAFC', display: 'flex', flexDirection: 'column' }}>
      <ConfirmationHeader onMenuToggle={handleMenuToggle} />
      

      <ProgressBar currentStep={6} />
      
      <ConfirmationMenu
        isOpen={isMenuOpen}
        onClose={handleMenuClose}
        userName={userName}
        voterId={voterId}
        onLogout={handleLogout}
        onVotingGuide={handleVotingGuide}
      />
      
      <AfterVoteContent onDone={handleDone} />
    </div>
  );
};

export default AfterVote;