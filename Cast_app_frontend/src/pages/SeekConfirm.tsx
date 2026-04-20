import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProgressBar from '../components/scan-QR-components/scan-comp/ProgressBar';
import ConfirmationHeader from '../components/confirmation-components/confirmation-comp/ConfirmationHeader';
import ConfirmationMenu from '../components/confirmation-components/confirmation-comp/ConfirmationMenu';
import { SeekConfirmContent } from '../components/seekConfirm-components/seekConfirm-comp';
import MinimalErrorPage from '../components/shared/MinimalErrorPage';
import { castVoterVote, getBallotOrder, saveBallotOrder, hasVoterAlreadyVoted } from '../utils';
import styles from '../components/seekConfirm-components/seekConfirm-styled-comp/SeekConfirm.module.css';


const allCandidates = [
  "James Bond", "Tony Stark", "Jack Sparrow", "Ellen Ripley",
  "Mr. Bean", "Homer Simpson", "Charlie Chaplin", "Peter Sellers",
  "Raymond Reddington", "Daenerys Targaryen", "Rachel Green", "Walter White"
];


const createBallotOrder = (selected: string, candidates: string[]) => {
  const remaining = candidates.filter(c => c !== selected);
  const shuffled = [...remaining];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return [selected, ...shuffled];
};

interface LocationState {
  userName?: string;
  voterId?: string;
  selectedCandidate?: string;
}

const SeekConfirm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [stateError, setStateError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const state = location.state as LocationState;
  const userData = {
    userName: state?.userName || 'Voter',
    voterId: state?.voterId || '0000'
  };
  const selectedCandidate = state?.selectedCandidate || 'Candidate A';

  
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
    const isInvalidVoterId = !state?.voterId || state.voterId === '0000';
    const isInvalidCandidate = !state?.selectedCandidate || state.selectedCandidate === 'Candidate A';
    
    if (isInvalidVoterId || isInvalidCandidate) {
      setStateError(true);
    
      const timer = setTimeout(() => {
        navigate('/', { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state?.voterId, state?.selectedCandidate, navigate]);

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

  const handleConfirmVote = async () => {
  
    if (userData.voterId === '0000' || !userData.voterId || 
        selectedCandidate === 'Candidate A' || !selectedCandidate) {
      setVoteError('Invalid session data. Cannot cast vote.');
      return;
    }
    
   
    if (isSubmitting) return;
    setIsSubmitting(true);
    
  
    setVoteError(null);
    
  
    try {
      await castVoterVote(userData.voterId, selectedCandidate);
      // Send voterid and selectedCandidate to API/backend
      console.log('Vote cast successfully for voter:', userData.voterId);
    } catch (voteError) {
      console.error('Error casting vote:', voteError);
      setVoteError('Unable to cast your vote. Please check your connection and try again.');
      setIsSubmitting(false);
      return; 
    }
    
   
    try {
      const existingBallot = await getBallotOrder(userData.voterId);
      
      if (!existingBallot || !existingBallot.ballotList || existingBallot.ballotList.length === 0) {
        
        const newBallot = createBallotOrder(selectedCandidate, allCandidates);
        await saveBallotOrder(userData.voterId, newBallot);
        console.log('Ballot created successfully for voter:', userData.voterId);
      } else {
        console.log('Ballot already exists for voter:', userData.voterId);
      }
    } catch (ballotError) {
      console.error('Error creating ballot:', ballotError);
      setVoteError('Unable to create ballot. Please check your connection and try again.');
      setIsSubmitting(false);
      return; 
    }
    
    
    navigate('/confirmation', { 
      state: { 
        userName: userData.userName,
        voterId: userData.voterId,
        selectedCandidate 
      }
    });
  };

  const handleChangeSelection = () => {
    navigate('/castvote', { 
      state: { 
        userName: userData.userName,
        voterId: userData.voterId 
      }
    });
  };


  if (accessDenied) {
    return <MinimalErrorPage />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7FAFC', display: 'flex', flexDirection: 'column' }}>

      <ConfirmationHeader onMenuToggle={handleMenuToggle} />


      <ProgressBar currentStep={3} />


      {stateError && (
        <div className={styles.stateErrorContainer}>
          <p className={styles.stateErrorText}>Invalid session data. Cannot cast vote.</p>
          <p className={styles.stateErrorText}>Redirecting to home page...</p>
        </div>
      )}


      {voteError && !stateError && (
        <div className={styles.voteErrorContainer}>
          <p className={styles.voteErrorText}>{voteError}</p>
        </div>
      )}


      {!stateError && (
        <SeekConfirmContent
          candidateName={selectedCandidate}
          onConfirmVote={handleConfirmVote}
          onChangeSelection={handleChangeSelection}
        />
      )}


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

export default SeekConfirm;
