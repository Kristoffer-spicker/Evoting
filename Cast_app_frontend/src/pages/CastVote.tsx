import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CastVote as CastVoteComponent } from '../components/cast-vote-components/cast-vote-comp';
import ConfirmationHeader from '../components/confirmation-components/confirmation-comp/ConfirmationHeader';
import ConfirmationMenu from '../components/confirmation-components/confirmation-comp/ConfirmationMenu';
import MinimalErrorPage from '../components/shared/MinimalErrorPage';
import { hasVoterAlreadyVoted } from '../utils';

interface LocationState {
  userName: string;
  voterId: string;
  token: string;
}
const allCandidates = [
  { id: 0, name: "James Bond"}, { id: 1, name: "Tony Stark"}, { id: 2, name: "Jack Sparrow"}, { id: 3, name: "Ellen Ripley"},
  { id: 4, name: "Mr. Bean" }, { id: 5, name: "Homer Simpson" }, {id: 6, name: "Charlie Chaplin"}, {id: 7, name: "Peter Sellers"}, 
  {id: 8, name: "Raymond Reddington"}, {id: 9, name: "Daenerys Targaryen"}, {id: 10, name: "Rachel Green"}, {id: 11, name: "Walter White"}
];

const CastVote: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  
  const state = location.state as LocationState;
  const userData = {
    userName: state?.userName || 'Voter',
    voterId: state?.voterId || '0000',
    token: state?.token || ''
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
    const selectedCandidate = allCandidates.find(c => c.name === candidate);
    navigate('/seekconfirm', { 
      state: { 
        userName: userData.userName,
        voterId: userData.voterId,
        selectedCandidate,
        token: userData.token
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