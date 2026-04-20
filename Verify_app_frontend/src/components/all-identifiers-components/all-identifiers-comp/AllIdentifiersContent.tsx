import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Info } from 'lucide-react';
import { ProgressSteps } from '@/components/preparation-components/preparation-comp';
import { getVoterIdentifiers } from '../../../utils/dataService';
import styles from '../all-identifiers-styled-comp/allIdentifiers.module.css';

interface Identifier {
  id: string;
  emoji: string;
  word: string;
}

interface AllIdentifiersContentProps {
  onFinish?: () => void;
}

const AllIdentifiersContent = ({ onFinish }: AllIdentifiersContentProps) => {
  const navigate = useNavigate();
  const steps = ["Voting QR Code", "After Vote casting", "True Identifier", "Identifiers for All Candidates", "Complete"];
  
  const [identifiers, setIdentifiers] = useState<Identifier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const [candidateNumber, setCandidateNumber] = useState<string>("");
  const [displayedIdentifier, setDisplayedIdentifier] = useState<Identifier | null>(null);
  const [searchedNumber, setSearchedNumber] = useState<number | null>(null);
  const [inputErrorMessage, setInputErrorMessage] = useState<string | null>(null);

  
  const [showLeavingModal, setShowLeavingModal] = useState(false);

  const handleFinishClick = () => {
    setShowLeavingModal(true);
  };

  const handleCancelLeaving = () => {
    setShowLeavingModal(false);
  };

  const handleContinueLeaving = () => {
    setShowLeavingModal(false);
    if (onFinish) {
      onFinish();
    } else {
      navigate('/complete');
    }
  };


  useEffect(() => {
    const loadIdentifiers = async () => {
      try {
        
        const authenticatedVoter = localStorage.getItem('surtr_authenticated_voter');
        if (!authenticatedVoter) {
          setError('No authenticated voter found. Please login first.');
          setLoading(false);
          return;
        }

        const voter = JSON.parse(authenticatedVoter);
        
       
        const voterIdentifiers = await getVoterIdentifiers(voter.voterId);
        
        
        const formattedIdentifiers = voterIdentifiers.map((identifier, index) => ({
          id: (index + 1).toString(),
          emoji: identifier.emoji,
          word: identifier.text
        }));

        setIdentifiers(formattedIdentifiers);
      } catch (err) {
        console.error('Error loading identifiers:', err);
        setError('Failed to load identifiers.');
      } finally {
        setLoading(false);
      }
    };

    loadIdentifiers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCandidateNumber(value);
    
    
    if (inputErrorMessage) {
      setInputErrorMessage(null);
    }
    
    
    if (value.trim() === '') {
      setDisplayedIdentifier(null);
      setSearchedNumber(null);
    }
  };

  const handleShowIdentifier = () => {
    const trimmedInput = candidateNumber.trim();
    
   
    if (trimmedInput === '') {
      setDisplayedIdentifier(null);
      setSearchedNumber(null);
      setInputErrorMessage(null);
      return;
    }
    
    const positionNumber = parseInt(trimmedInput);
    
   
    if (isNaN(positionNumber) || positionNumber < 1 || positionNumber > 12) {
      setDisplayedIdentifier(null);
      setSearchedNumber(null);
      setInputErrorMessage('The candidate number must be between 1 and 12.');
      return;
    }

   
    setInputErrorMessage(null);
    
   
    const identifier = identifiers[positionNumber - 1];
    setDisplayedIdentifier(identifier);
    setSearchedNumber(positionNumber);
  };

 
  if (loading) {
    return null; 
  }

 
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.leftCard}>
          <p style={{color: 'red'}}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
    
      <ProgressSteps currentStep={4} steps={steps} />

      <h1 className={styles.pageTitle}>Identifiers for All Candidates</h1>

    
      <div className={styles.topImportantBanner}>
        <div className={styles.topImportantHeader}>
          <AlertTriangle className={styles.topImportantIcon} />
          <span className={styles.topImportantTitle}>Important</span>
        </div>
        <p className={styles.topImportantText}>
          This step is for coerced voters. If you are not under coercion, you do not need to follow the instructions for coercion protection on this page and may scroll down and click <strong>'Complete Voting Process'</strong>
        </p>
        <p className={styles.topImportantText}>
          If you are under coercion, you may follow the Instructions for coercion protection below, then click <strong>'Complete Voting Process'</strong>
        </p>
      </div>

      <div className={styles.container}>
        
        <div className={styles.leftCard}>
          
          <div className={styles.instructionBox}>
            <h2 className={styles.instructionTitle}>Instructions for Coercion Protection</h2>

            <p className={styles.instructionText}>
              Open your <strong>Personalized Ballot</strong> now in the SURTR Vote app on your phone and keep it open while reviewing this page.
            </p>
            
            <p className={styles.instructionText}>
              This page shows your vote verification identifiers for all candidates in this election.
            </p>
            
             <p className={styles.instructionText}>
             You may memorize or securely store the identifier of any candidate to support later vote verification for that candidate.
            </p>

             <p className={styles.instructionText}>
             The example below shows how to view an identifier.
            </p>
            
            
            <div className={styles.exampleSection}>
              <h3 className={styles.exampleTitle}>Example: How to View an Identifier</h3>
              
              <p className={styles.exampleText}>
                If you are coerced to verify your vote for <strong>George Brown</strong>, knowing that candidate’s identifier in advance will help with later vote verification for that candidate.
              </p>
              
              <p className={styles.stepsTitle}>Follow these steps to see the identifier for George Brown: </p>
              
              <div className={styles.stepsList}>
                <div className={styles.step}>
                  <span className={styles.stepNumber}>1.</span>
                  <span className={styles.stepText}>
                  Find <strong>George Brown</strong> in your personalized ballot on your phone, and note the position number.<br />
                    e.g., <strong>George Brown</strong> is positioned at number <span className={styles.numberHighlight}>9</span>
                  </span>
                </div>
                
                <div className={styles.step}>
                  <span className={styles.stepNumber}>2.</span>
                  <span className={styles.stepText}>
                    On this page, enter <strong>9</strong> and click <strong><em>Show Identifier.</em></strong>
                  </span>
                </div>
                
                <div className={styles.step}>
                  <span className={styles.stepNumber}>3.</span>
                  <span className={styles.stepText}>
                    The identifier shown corresponds to <strong>George Brown.</strong>
                  </span>
                </div>

                <p className={styles.exampleText}>
               You may share the shown identifier with the coercer. Sharing this identifier will not reveal your actual choice.
              </p>
              </div>
              
              <div className={styles.resultBox}>
                <p className={styles.resultTitle}>In the Verification Result:</p>
                <p className={styles.resultText}>
                  The shown identifier will be associated with <strong>George Brown</strong> in the vote verification results, enabling verification for <strong>George Brown</strong> without revealing your actual choice.
                </p>
              </div>
              
              <p className={styles.nbText}>
                <strong>N.B.</strong> The candidate name used in this example is not a real candidate in the election and is used only to explain the scenario.
              </p>
            </div>
          </div>
        </div>

      
        <div className={styles.rightCard}>
       
          <div className={styles.inputSection}>
            <p className={styles.inputTitle}>
             Enter the candidate number from your <strong>Personalized Ballot</strong> that you are being coerced to vote for to view the corresponding identifier:
            </p>
            
            <div className={styles.inputRow}>
              <input
                type="text"
                placeholder="Enter candidate number (e.g. 5)"
                value={candidateNumber}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && handleShowIdentifier()}
                className={styles.candidateInput}
              />
              <button onClick={handleShowIdentifier} className={styles.showButton} disabled={candidateNumber.trim() === ''}>
                Show Identifier
              </button>
            </div>
            
           
            {inputErrorMessage && (
              <p className={styles.inputErrorMessage}>{inputErrorMessage}</p>
            )}
          </div>

        
          {displayedIdentifier ? (
            <>
             
              <p className={styles.resultMessage}>
                Identifier for candidate number <em>{searchedNumber}</em> in your Personalized Ballot is shown below as a pair consisting of a word and an image:
              </p>
              
             
              <div className={styles.identifierDisplay}>
                <div className={styles.largeEmoji}>{displayedIdentifier.emoji}</div>
                <div className={styles.largeWord}>{displayedIdentifier.word}</div>
              </div>
              
           
              <div className={styles.identifierInfoBox}>
                <div className={styles.identifierInfoIcon}>
                  <Info/>
                </div>
                <p className={styles.identifierInfoText}>
                  {searchedNumber === 1
                    ? "This is the True Identifier of your vote. It will be associated with the candidate you actually voted for in the verification results. Do not share this identifier with anyone."
                    : <>This identifier will be associated with the candidate at number <strong>{searchedNumber}</strong> in your Personalized Ballot in the verification results. You may share this identifier with the coercer.</>
                  }
                </p>
              </div>
            </>
          ) : (
           
            <div className={styles.emptyState}>
              <p className={styles.emptyStateTitle}>No identifier shown</p>
              <p className={styles.emptyStateText}>Enter a candidate number and click "Show Identifier"</p>
            </div>
          )}
        </div>
      </div>

    
      <div className={styles.finishButtonContainer}>
        <button onClick={handleFinishClick} className={styles.primaryButton}>
          Complete Voting Process
        </button>
      </div>

      
      {showLeavingModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalIconWrapper}>
              <AlertTriangle size={32} className={styles.modalIcon} />
            </div>
            <h2 className={styles.modalTitle}>Complete Voting Process?</h2>
            <p className={styles.modalText}>You are about to complete the voting process.</p>
            <p className={styles.modalText}>
              You will not be able to return to this <strong>'Identifiers for All Candidates'</strong> page again.
            </p>
            <p className={styles.modalQuestion}>Do you want to continue?</p>
            <div className={styles.modalButtonContainer}>
              <button onClick={handleContinueLeaving} className={styles.primaryButton}>
                Continue
              </button>
              <button onClick={handleCancelLeaving} className={styles.secondaryButton}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AllIdentifiersContent;
