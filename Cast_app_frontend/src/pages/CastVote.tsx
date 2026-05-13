import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CastVote as CastVoteComponent } from '../components/cast-vote-components/cast-vote-comp';
import ConfirmationHeader from '../components/confirmation-components/confirmation-comp/ConfirmationHeader';
import ConfirmationMenu from '../components/confirmation-components/confirmation-comp/ConfirmationMenu';
import MinimalErrorPage from '../components/shared/MinimalErrorPage';
import { hasVoterAlreadyVoted, fetchCandidateList } from '../utils';

interface LocationState {
  userName: string;
  voterId: string;
  qr_data: string;
}

const CastVote: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [candidateList, setCandidateList] = useState<{id: number, name: string}[]>([]);

  useEffect(() => {
    fetchCandidateList().then(setCandidateList).catch(console.error);
  }, []);
  
  const state = location.state as LocationState;
  const userData = {
    userName: state?.userName || 'Voter',
    voterId: state?.voterId || '0000',
    qr_data: state?.qr_data || ''
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

  const handleVoteSubmit = (candidate: string) => {
    const selectedCandidate = candidateList.find(c => c.name === candidate);
    navigate('/seekconfirm', {
      state: { 
        userName: userData.userName,
        voterId: userData.voterId,
        selectedCandidate,
        qr_data: userData.qr_data
      }
    });
  };

  const handleCancel = () => {
    navigate('/', { replace: true });
  };

  if (accessDenied) {
    return <MinimalErrorPage />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7FAFC', display: 'flex', flexDirection: 'column' }}>
      <CastVoteComponent
        onVoteSubmit={handleVoteSubmit}
        onCancel={handleCancel}
        headerComponent={<ConfirmationHeader onMenuToggle={handleMenuToggle} />}
        candidates={candidateList}
      />
      <ConfirmationMenu
        isOpen={isMenuOpen}
        onClose={handleMenuClose}
        userName={userData.userName}
        voterId={userData.voterId}
        onLogout={handleLogout}
        onVotingGuide={handleVotingGuide}
      />
    </div>
  );
};

export default CastVote;