import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ScanQR as ScanQRComponent } from '../components/scan-QR-components/scan-comp';
import ConfirmationHeader from '../components/confirmation-components/confirmation-comp/ConfirmationHeader';
import ConfirmationMenu from '../components/confirmation-components/confirmation-comp/ConfirmationMenu';
import ScanSuccessPopup from '../components/scan-QR-components/scan-comp/ScanSuccessPopup';
import ScanQRLayout from '../components/scan-QR-components/scan-comp/ScanQRLayout';
import MinimalErrorPage from '../components/shared/MinimalErrorPage';
import { updateVoterQRStatus, hasVoterAlreadyVoted } from '../utils';

interface LocationState {
  userName: string;
  voterId: string;
}

const ScanQR: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  
  const state = location.state as LocationState;
  const userData = {
    userName: state?.userName || 'Voter',
    voterId: state?.voterId || '0000'
  };

  useEffect(() => {
    const checkVotingStatus = async () => {
      if (userData.voterId && userData.voterId !== '0000') {
        const hasVoted = await hasVoterAlreadyVoted(userData.voterId);
        if (hasVoted) {
          setAccessDenied(true);
        }
      }
    };
    checkVotingStatus();
  }, [userData.voterId]);

  useEffect(() => {
    const handlePopState = () => {
      navigate('/', { replace: true });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate, userData]);

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

  const handleScanResult = async (_result: string) => {
    try {
      await updateVoterQRStatus(userData.voterId);
      
      setShowSuccessPopup(true);
    } catch (error) {
      console.error('Error updating QR status:', error);
      setShowSuccessPopup(true);
    }
  };

  const handleCancel = () => {
    console.log('User cancelled scanning');
    navigate('/', { replace: true });
  };

  const handleError = (error: string) => {

    console.error('Scanning error:', error);
    
 
    alert(`Camera error: ${error}`);
  };

  const handlePopupContinue = () => {
    setShowSuccessPopup(false);
    navigate('/castvote', { state: userData, replace: true });
  };

  const handlePopupCancel = () => {
    setShowSuccessPopup(false);

  };

 
  if (accessDenied) {
    return <MinimalErrorPage />;
  }

  return (
    <ScanQRLayout>
      <ScanQRComponent 
        onScanResult={handleScanResult}
        onCancel={handleCancel}
        onError={handleError}
        headerComponent={<ConfirmationHeader onMenuToggle={handleMenuToggle} />}
      />
      <ConfirmationMenu
        isOpen={isMenuOpen}
        onClose={handleMenuClose}
        userName={userData.userName}
        voterId={userData.voterId}
        onLogout={handleLogout}
    
        onVotingGuide={handleVotingGuide}
      />
      
      <ScanSuccessPopup
        isVisible={showSuccessPopup}
        onContinue={handlePopupContinue}
        onCancel={handlePopupCancel}
      />
    </ScanQRLayout>
  );
};

export default ScanQR;