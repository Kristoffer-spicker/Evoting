import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProgressBar from '../components/scan-QR-components/scan-comp/ProgressBar';
import ConfirmationHeader from '../components/confirmation-components/confirmation-comp/ConfirmationHeader';
import ConfirmationMenu from '../components/confirmation-components/confirmation-comp/ConfirmationMenu';
import { SeekConfirmContent } from '../components/seekConfirm-components/seekConfirm-comp';
import MinimalErrorPage from '../components/shared/MinimalErrorPage';
import { castVoterVote, getBallotOrder, saveBallotOrder, hasVoterAlreadyVoted } from '../utils';
import styles from '../components/seekConfirm-components/seekConfirm-styled-comp/SeekConfirm.module.css';

export type Candidate = {
  id: number;
  name: string;
}
const allCandidates = [
  { id: 0, name: "James Bond"}, { id: 1, name: "Tony Stark"}, { id: 2, name: "Jack Sparrow"}, { id: 3, name: "Ellen Ripley"}
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
  selectedCandidate?: Candidate;
  qr_data?: string
}

const SeekConfirm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [stateError, setStateError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>(''); // ← add this


  const state = location.state as LocationState;
  const userData = {
    userName: state?.userName || 'Voter',
    voterId: state?.voterId || '0000',
    qr_data: state?.qr_data || ''
  };
  const selectedCandidate = state?.selectedCandidate || {id:100, name: 'Candidate A'};

  
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
    const isInvalidCandidate = !state?.selectedCandidate || state.selectedCandidate.name === 'Candidate A';
    
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
      selectedCandidate.name === 'Candidate A' || !selectedCandidate) {
    setVoteError('Invalid session data. Cannot cast vote.');
    return;
  }
  if (isSubmitting) return;
  setIsSubmitting(true);
  setVoteError(null);

  const url = (import.meta as any).env?.VITE_API_URL;
  setDebugInfo(`API URL: ${url} | Voter: ${userData.voterId} | Candidate: ${selectedCandidate.name}`);

  try {
    await castVoterVote(userData.voterId, selectedCandidate, userData.qr_data);
    setDebugInfo(prev => prev + ' | Vote cast OK');
  } catch (voteError) {
    setDebugInfo(prev => prev + ` | Vote error: ${voteError instanceof Error ? voteError.message : String(voteError)}`);
    setVoteError('Unable to cast your vote. Please check your connection and try again.');
    setIsSubmitting(false);
    return;
  }

  try {
    const existingBallot = await getBallotOrder(userData.voterId);
    console.log('Existing ballot:', existingBallot);
    if (!existingBallot || !existingBallot.ballotList || existingBallot.ballotList.length === 0) {
      const newBallot = createBallotOrder(selectedCandidate.name, allCandidates.map(c => c.name));
      await saveBallotOrder(userData.voterId, newBallot);
      setDebugInfo(prev => prev + ' | Ballot saved OK');
    }
  } catch (ballotError) {
    setDebugInfo(prev => prev + ` | Ballot error: ${ballotError instanceof Error ? ballotError.message : String(ballotError)}`);
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
          candidateName={selectedCandidate.name}
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

        {/* Debug overlay - visible on phone */}
        {debugInfo && (
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'black', color: 'lime', padding: '10px',
            fontSize: '11px', zIndex: 9999, wordBreak: 'break-all'
          }}>
            {debugInfo}
          </div>
        )}

    </div>
  );
};

export default SeekConfirm;
