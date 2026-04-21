import { useState, useRef, useEffect } from 'react';
import { Search, CheckCircle, AlertTriangle } from 'lucide-react';
import CandidateIdentifierModal from './CandidateIdentifierModal';
import { getCurrentAuthenticatedVoter, checkVoterHasVoted, areElectionResultsPublished, buildVerificationTable } from '@/utils/dataService';
import styles from '../verify-vote-styled-comp/verifyVote.module.css';

interface CandidateIdentifier {
  id: string;
  candidate: string;
  emoji: string;
  word: string;
}

const VerifyVoteContent = () => {
  
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  
  
  const [realCandidateIdentifiers, setRealCandidateIdentifiers] = useState<CandidateIdentifier[]>([]);


  const placeholderData: CandidateIdentifier[] = [
    { id: "1", candidate: "Candidate Name", emoji: "🔒", word: "••••" },
    { id: "2", candidate: "Candidate Name", emoji: "🔒", word: "••••" },
    { id: "3", candidate: "Candidate Name", emoji: "🔒", word: "••••" },
    { id: "4", candidate: "Candidate Name", emoji: "🔒", word: "••••" },
    { id: "5", candidate: "Candidate Name", emoji: "🔒", word: "••••" },
    { id: "6", candidate: "Candidate Name", emoji: "🔒", word: "••••" },
  ];

  const [identifierSearchTerm, setIdentifierSearchTerm] = useState("");
  const [candidateSearchTerm, setCandidateSearchTerm] = useState("");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [selectedRowData, setSelectedRowData] = useState<CandidateIdentifier | null>(null);
  const rowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});

  const isActive = hasVoted;

  
  const candidateIdentifiers = isActive ? realCandidateIdentifiers : placeholderData;

 
  useEffect(() => {
    const loadVerificationData = async () => {
      try {
        const authenticatedVoter = getCurrentAuthenticatedVoter();
        if (!authenticatedVoter) {
          setIsLoading(false);
          return;
        }

      
        const voterHasVoted = await checkVoterHasVoted(authenticatedVoter.voterId);
        setHasVoted(voterHasVoted);

       
        const resultsArePublished = await areElectionResultsPublished();

       
        if (voterHasVoted && resultsArePublished) {
          const verificationResult = await buildVerificationTable(authenticatedVoter.voterId);
          
          if (verificationResult.success && verificationResult.tableData) {
            setRealCandidateIdentifiers(verificationResult.tableData);
          } else {
            setVerificationError(verificationResult.error || 'Failed to load verification data');
          }
        }
      } catch (error) {
        console.error('Error loading verification data:', error);
        setVerificationError('Failed to load verification data');
      } finally {
        setIsLoading(false);
      }
    };

    loadVerificationData();
  }, []);

  const handleContactAuthority = () => {
    console.log("Contacting election authority...");
  };

  const handleRowClick = (rowData: CandidateIdentifier) => {
    if (isActive) {
      setSelectedRowData(rowData);
    }
  };

  const handleCloseModal = () => {
    setSelectedRowData(null);
  };

  const handleIdentifierSearch = () => {
    if (identifierSearchTerm.trim() === "") {
      setHighlightedId(null);
      return;
    }

    const found = candidateIdentifiers.find((item) =>
      item.word.toLowerCase().includes(identifierSearchTerm.toLowerCase())
    );

    if (found) {
      setHighlightedId(found.id);
      setTimeout(() => {
        setHighlightedId(null);
      }, 3000);
    }
  };

  const handleCandidateSearch = () => {
    if (candidateSearchTerm.trim() === "") {
      setHighlightedId(null);
      return;
    }

    const found = candidateIdentifiers.find((item) =>
      item.candidate.toLowerCase().includes(candidateSearchTerm.toLowerCase())
    );

    if (found) {
      setHighlightedId(found.id);
      setTimeout(() => {
        setHighlightedId(null);
      }, 5000);
    }
  };

  useEffect(() => {
    if (highlightedId) {
      const ref = rowRefs.current[highlightedId];
      if (ref) {
        ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedId]);

  
  if (isLoading) {
    return (
      <div className={styles.mainContent}>
        <p>Loading...</p>
      </div>
    );
  }

 
  if (verificationError) {
    return (
      <div className={styles.mainContent}>
        <div className={styles.contentContainer}>
          <div className={styles.gridLayout}>
            <div className={styles.leftCard}>
              <div className={`${styles.statusBox} ${styles.warning}`}>
                <AlertTriangle className={`${styles.statusIcon} ${styles.warning}`} strokeWidth={2} />
                <div>
                  <h3 className={styles.statusTitle}>Verification Error</h3>
                  <p className={styles.statusText}>{verificationError}</p>
                </div>
              </div>
              
              <button
                onClick={handleContactAuthority}
                className={styles.contactButton}
              >
                Contact Election Authority
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
  
      <div className={styles.progressBar}>
        <div className={styles.progressContainer}>
          <h2 className={styles.progressTitle}>Vote Verification</h2>
        </div>
      </div>

     
      <div className={styles.mainContent}>
        <div className={styles.contentContainer}>
          {!isActive ? (
           
            <div className={styles.inactiveContainer}>
              <div className={`${styles.statusBox} ${styles.warning}`}>
                <AlertTriangle className={`${styles.statusIcon} ${styles.warning}`} strokeWidth={2} />
                <div>
                  <p className={styles.statusText}>
                    Vote verification is not available because no vote was found for you in this election.
                    If this outcome is unexpected, please contact the election authority.
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleContactAuthority}
                className={styles.contactButton}
              >
                Contact Election Authority
              </button>
            </div>
          ) : (
          
            <div className={styles.gridLayout}>
            
              <div className={styles.leftCard}>
                <div className={styles.activeState}>
                  <div className={`${styles.statusBox} ${styles.success}`}>
                    <div className={styles.iconCircle}>
                      <CheckCircle className={`${styles.statusIcon} ${styles.success}`} strokeWidth={2} />
                    </div>
                    <p className={styles.statusText}>Your vote verification results are shown on the right.</p>
                  </div>

                  <div className={styles.instructionContainer}>
                    <h3 className={styles.instructionHeading}>Instructions</h3>
                    <p className={styles.instructionText}>
                      Find your True Identifier in the table on the right. It should appear next to the candidate you voted for.
                    </p>
                    <p className={styles.instructionTextBold}>
                      If your True Identifier appears next to the candidate you voted for, your vote has been verified successfully.
                    </p>
                  </div>

                  <div className={`${styles.statusBox} ${styles.warning}`}>
                    <AlertTriangle className={`${styles.statusIcon} ${styles.warning}`} strokeWidth={2} />
                    <p>
                      If your True Identifier appears next to a different candidate, or does not appear in the table, please contact the Election Authority.
                    </p>
                  </div>

                  <button
                    onClick={handleContactAuthority}
                    className={styles.contactButton}
                  >
                    Contact Election Authority
                  </button>
                </div>
              </div>

             
            <div className={styles.rightCard}>
              <p className={styles.hintText} style={{  marginTop: '.2rem' }}>Use search to quickly find an identifier or candidate.</p>
              
             
              <div className={styles.searchSection}>
                <div className={styles.searchRow}>
                  <input
                    type="text"
                    placeholder="Search by identifier word..."
                    value={identifierSearchTerm}
                    onChange={(e) => { setIdentifierSearchTerm(e.target.value); setCandidateSearchTerm(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleIdentifierSearch()}
                    disabled={!isActive}
                    className={styles.searchInput}
                  />
                  <button
                    onClick={handleIdentifierSearch}
                    disabled={!isActive || identifierSearchTerm.trim() === ''}
                    className={styles.searchButton}
                  >
                    <Search className={styles.searchIcon} strokeWidth={2} />
                    Find
                  </button>
                </div>

                <div className={styles.searchRow}>
                  <input
                    type="text"
                    placeholder="Search by candidate name..."
                    value={candidateSearchTerm}
                    onChange={(e) => { setCandidateSearchTerm(e.target.value); setIdentifierSearchTerm(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleCandidateSearch()}
                    disabled={!isActive}
                    className={styles.searchInput}
                  />
                  <button
                    onClick={handleCandidateSearch}
                    disabled={!isActive || candidateSearchTerm.trim() === ''}
                    className={styles.searchButton}
                  >
                    <Search className={styles.searchIcon} strokeWidth={2} />
                    Find
                  </button>
                </div>
              </div>

              <p className={styles.hintText}>Scroll down to see the full list. You can tap any row to open it in an enlarged view.</p>

            
              <div className={styles.tableContainer}>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead className={styles.tableHead}>
                      <tr>
                        <th className={styles.tableHeadCell}>
                          Identifiers
                        </th>
                        <th className={styles.tableHeadCell}>
                          Candidates
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidateIdentifiers.map((item) => (
                        <tr
                          key={item.id}
                          ref={(el) => (rowRefs.current[item.id] = el)}
                          onClick={() => handleRowClick(item)}
                          className={`${styles.tableRow} ${
                            highlightedId === item.id ? styles.highlighted : ''
                          } ${!isActive ? styles.inactive : ''} ${
                            isActive ? styles.clickable : ''
                          }`}
                        >
                          <td className={styles.tableCell}>
                            <div className={styles.identifierCell}>
                              <span className={styles.identifierEmoji}>{item.emoji}</span>
                              <span className={styles.identifierWord}>{item.word}</span>
                            </div>
                          </td>
                          <td className={styles.tableCell}>
                            <span className={styles.candidateName}>{item.candidate}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>


              </div>
            </div>
          )}
        </div>
      </div>

    
      {selectedRowData && (
        <CandidateIdentifierModal 
          candidateIdentifier={selectedRowData} 
          onClose={handleCloseModal} 
        />
      )}
    </>
  );
};

export default VerifyVoteContent;
