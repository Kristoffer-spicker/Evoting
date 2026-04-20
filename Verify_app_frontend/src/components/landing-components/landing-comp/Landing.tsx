import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Laptop, Smartphone, ArrowRight, Info } from "lucide-react";
import styles from '../landing-styled-comp/landing.module.css';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  const handleRegisterClick = () => {
    navigate('/register');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div className={styles.landingPage}>
     
      <header className={styles.header}>
        <h1 className={styles.title}>
          Welcome to <span className={styles.brandName}>SURTR Verify</span>
        </h1>
      </header>

     
      <div className={styles.contentWrapper}>
        <div className={styles.container}>
        
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>About the SURTR Voting System:</h3>
            <p className={styles.cardText}>
              SURTR is an electronic voting system that ensures secure vote casting and independent verification without revealing the voter's choice.
            </p>
            <h4 className={styles.cardSubtitle}>What makes SURTR different:</h4>
            <p className={styles.cardText}>
              SURTR is designed to reduce voter coercion by allowing vote verification for any candidate, while ensuring that only you can identify and confirm who you actually voted for.
            </p>
            <p className={styles.cardText}>
              After vote casting, vote verification identifiers will be shown on your computer in the SURTR Verify app. They are displayed as a pair consisting of a word and an image.
            </p>
             <p className={styles.cardText}>
              The True Identifier enables verification for the candidate you voted for, while the identifiers for all candidates enable verification for any other candidate in the election.
            </p>
            <p className={styles.cardText}>  
            Pay attention to these identifiers and make sure you can remember them later to verify your vote.
            </p>
          </div>

          
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Two-Device System</h3>
            <div className={styles.twoDeviceGrid}>
              <div className={styles.deviceItem}>
                <div className={styles.deviceIconContainer}>
                  <Laptop className={styles.deviceIcon} strokeWidth={2} />
                </div>
                <div className={styles.deviceInfo}>
                  <p className={styles.deviceName}>SURTR Verify</p>
                  <p className={styles.deviceDescription}>Computer for registration and verification</p>
                </div>
              </div>
              <div className={styles.deviceItem}>
                <div className={styles.deviceIconContainer}>
                  <Smartphone className={styles.deviceIcon} strokeWidth={2} />
                </div>
                <div className={styles.deviceInfo}>
                  <p className={styles.deviceName}>SURTR Vote</p>
                  <p className={styles.deviceDescription}>Mobile phone for casting your vote</p>
                </div>
              </div>
            </div>
          </div>

          
          <div className={styles.card}>
            <h3 className={styles.cardTitleCentered}>Voting Process</h3>
            <div className={styles.processFlow}>
            
              <div className={styles.phaseStep}>
                <div className={styles.phaseIconContainer}>
                  <Laptop className={styles.phaseIcon} strokeWidth={2} />
                </div>
                <span className={styles.phaseBadge}>Phase 1</span>
                <p className={styles.phaseTitle}>Registration</p>
                <p className={styles.phaseSubtitle}>Computer</p>
              </div>

              <div className={styles.arrowContainer}>
                <ArrowRight className={styles.flowArrow} strokeWidth={1.5} />
              </div>

             
              <div className={styles.phaseStep}>
                <div className={styles.phaseIconContainer}>
                  <Smartphone className={styles.phaseIcon} strokeWidth={2} />
                </div>
                <span className={styles.phaseBadge}>Phase 2</span>
                <p className={styles.phaseTitle}>Vote Casting</p>
                <p className={styles.phaseSubtitle}>Mobile Phone</p>
              </div>

              <div className={styles.arrowContainer}>
                <ArrowRight className={styles.flowArrow} strokeWidth={1.5} />
              </div>

             
              <div className={styles.phaseStep}>
                <div className={styles.phaseIconContainer}>
                  <Laptop className={styles.phaseIcon} strokeWidth={2} />
                </div>
                <span className={styles.phaseBadge}>Phase 3</span>
                <p className={styles.phaseTitle}>Review Verification Identifiers</p>
                <p className={styles.phaseSubtitle}>Same computer</p>
              </div>

              <div className={styles.arrowContainer}>
                <ArrowRight className={styles.flowArrow} strokeWidth={1.5} />
              </div>

              
              <div className={styles.phaseStep}>
                <div className={styles.phaseIconContainer}>
                  <Laptop className={styles.phaseIcon} strokeWidth={2} />
                </div>
                <span className={styles.phaseBadge}>Phase 4</span>
                <p className={styles.phaseTitle}>Vote Verification</p>
                <p className={styles.phaseSubtitle}>Same computer</p>
              </div>
            </div>
          </div>

       
          <div className={styles.card}>
            <h3 className={styles.cardTitleCentered}>Get Started</h3>
            <p className={styles.getStartedText}>Register as a voter or login to continue</p>
            <div className={styles.buttonGroup}>
              <button className={styles.registerButton} onClick={handleRegisterClick}>
                Register
              </button>
              <button className={styles.loginButton} onClick={handleLoginClick}>
                Login
              </button>
            </div>
            <div className={styles.infoNote}>
              <Info className={styles.infoIcon} strokeWidth={2} />
              <span>Remember to use this device for verification later</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;