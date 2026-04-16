import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProgressSteps } from '@/components/preparation-components/preparation-comp'
import { AfterVoteCastPopup } from './AfterVoteCastPopup'
import styles from '../main-menu-styled-comp/mainMenu.module.css'

export function MainMenuContent(): React.JSX.Element {
  const navigate = useNavigate()
  const [showPopup, setShowPopup] = useState(false)
  const steps = ["Voting QR Code", "After Vote casting", "True Identifier", "Identifiers for All Candidates", "Complete"]

  const handleShowTrueIdentifier = () => {
    setShowPopup(true)
  }

  const handleConfirmTrueIdentifier = () => {
    setShowPopup(false)
    navigate('/true-identifier')
  }

  const handleCancelPopup = () => {
    setShowPopup(false)
  }

  const handleBackToQRCode = () => {
    navigate('/qr-code')
  }

  return (
    <>
      <div className={styles.mainContent}>
        <div className={styles.container}>
        
          <ProgressSteps currentStep={2} steps={steps} />

         
          <div className={styles.mainCard}>
         
            <h1 className={styles.mainTitle}>After Vote casting</h1>
            
          
            <p className={styles.subtitle}>Ready to view your vote verification identifier</p>

          
            <div className={styles.instructionBox}>
              <h2 className={styles.instructionTitle}>Instructions</h2>
              <p className={styles.instructionText}>
                Only proceed to the next step after casting your vote in the <strong>SURTR Vote</strong> app on your phone.
              </p>
              <p className={styles.instructionText}>
                The next step will show the True Identifier for your vote.
              </p>
              <p className={styles.instructionText}>
                The True Identifier will allow you to independently verify your vote during verification.
              </p>

              <p className={styles.instructionText}>
                The True Identifier can be viewed only once.
              </p>
            </div>

          
            <div className={styles.stepsSection}>
              <h3 className={styles.stepsTitle}>Please make sure you have completed the steps below before continuing</h3>
              
              <div className={styles.stepsList}>
                <div className={styles.stepItem}>
                  <div className={styles.stepNumber}>1</div>
                  <span className={styles.stepText}>You have cast your vote in the <strong>SURTR Vote</strong> app on your phone.</span>
                </div>
                
                <div className={styles.stepItem}>
                  <div className={styles.stepNumber}>2</div>
                  <span className={styles.stepText}>You have seen the confirmation that your vote was successfully cast.</span>
                </div>
                
              </div>
            </div>

            
            <div className={styles.buttonContainer}>
              <button
                onClick={handleShowTrueIdentifier}
                className={styles.primaryButton}
              >
                Yes, I have voted – show the True Identifier
              </button>
              
              <button
                onClick={handleBackToQRCode}
                className={styles.secondaryButton}
              >
                No, take me back to the QR code
              </button>
            </div>
          </div>
        </div>
      </div>
      
    
      {showPopup && (
        <AfterVoteCastPopup
          onConfirm={handleConfirmTrueIdentifier}
          onCancel={handleCancelPopup}
        />
      )}
    </>
  )
}
