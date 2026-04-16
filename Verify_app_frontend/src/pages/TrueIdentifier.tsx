import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TriangleAlert } from 'lucide-react'
import { MainMenuNavigation } from '@/components/main-menu-components/main-menu-comp'
import { ProgressSteps } from '@/components/preparation-components/preparation-comp'
import { TrueIdentifierContent, WarningPopup } from '@/components/true-identifier-components/true-identifier-comp'
import { getVoterTrueIdentifier, hasVoterSeenTrueIdentifier, markTrueIdentifierSeen } from '@/utils/dataService'
import styles from '@/components/true-identifier-components/true-identifier-styled-comp/trueIdentifier.module.css'

export function TrueIdentifier(): React.JSX.Element {
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState<{emoji: string, word: string} | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const steps = ["Voting QR Code", "After Vote casting", "True Identifier", "Identifiers for All Candidates", "Complete"]

  useEffect(() => {
    const loadTrueIdentifier = async () => {
      try {
      
        const authenticatedVoter = localStorage.getItem('surtr_authenticated_voter')
        if (!authenticatedVoter) {
          setError('No authenticated voter found. Please complete registration and login first.')
          return
        }

        const voter = JSON.parse(authenticatedVoter)
        
        
        const alreadySeen = await hasVoterSeenTrueIdentifier(voter.voterId)
        if (alreadySeen) {
          setError('You have already seen your True Identifier')
          return
        }

        const trueIdentifier = await getVoterTrueIdentifier(voter.voterId)
        
        if (trueIdentifier) {
          setIdentifier({
            emoji: trueIdentifier.emoji,
            word: trueIdentifier.text
          })
        } else {
          setError('Could not load your true identifier.')
        }
      } catch (err) {
        console.error('Error loading true identifier:', err)
        setError('Failed to load your true identifier.')
      } finally {
        setIsLoading(false)
      }
    }

    loadTrueIdentifier()
  }, [navigate])

  if (isLoading) {
    return (
      <div className={styles.truePage}>
        <MainMenuNavigation showBackButton={false} />
        <div className={styles.mainContent}>
          <div className={styles.loadingText}>Loading...</div>
        </div>
      </div>
    )
  }

  if (error) {
    const isAlreadySeenError = error === 'You have already seen your True Identifier'
    
  
    if (isAlreadySeenError) {
      return (
        <div className={styles.errorPageMinimal}>
          <div className={styles.errorMessageContainer}>
            <TriangleAlert className={styles.errorMessageIcon} />
            <span className={styles.errorMessageText}>This page is no longer accessible.</span>
          </div>
        </div>
      )
    }
    
  
    return (
      <div className={styles.truePage}>
        <MainMenuNavigation showBackButton={false} />
        <div className={styles.mainContent}>
          <div className={styles.container}>
            <ProgressSteps currentStep={3} steps={steps} />
            <div className={styles.errorContainerGeneric}>
              {error || 'Could not load identifier'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleOk = () => {
    setShowSuccessPopup(true)
  }

  const handleWarningContinue = async () => {

    const authenticatedVoter = localStorage.getItem('surtr_authenticated_voter')
    if (authenticatedVoter) {
      const voter = JSON.parse(authenticatedVoter)
      try {
        await markTrueIdentifierSeen(voter.voterId)
      } catch (err) {
        console.error('Error marking identifier as seen:', err)
      }
    }
    setShowSuccessPopup(false)
    navigate('/all-identifiers')
  }

  const handleWarningCancel = () => {
    setShowSuccessPopup(false)
  }

  return (
    <div className={styles.truePage}>
      <MainMenuNavigation showBackButton={false} />
      
      <div className={styles.mainContent}>
        <div className={styles.container}>
          <ProgressSteps currentStep={3} steps={steps} />
          
          {identifier && <TrueIdentifierContent identifier={identifier} onOk={handleOk} />}
        </div>
      </div>

     
      {showSuccessPopup && (
        <WarningPopup 
          onContinue={handleWarningContinue} 
          onCancel={handleWarningCancel} 
        />
      )}
    </div>
  )
}
