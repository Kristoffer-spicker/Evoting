import React, { useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { saveVoter } from '@/utils/dataService';
import styles from '../registration-styled-comp/registration.module.css';

interface RegistrationProps {
  onRegister?: (data: { name: string; voterId: string; success: boolean }) => void;
}

const Registration: React.FC<RegistrationProps> = ({ onRegister }) => {
  const [name, setName] = useState('');
  const [voterId, setVoterId] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !voterId.trim() || !password.trim() || !repeatPassword.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== repeatPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const voter = await saveVoter(name, voterId, password);
      setError('');
      
     
      localStorage.setItem('surtr_authenticated_voter', JSON.stringify(voter));
      
      setName('');
      setVoterId('');
      setPassword('');
      setRepeatPassword('');
      
      if (onRegister) {
        onRegister({ name: voter.name, voterId: voter.voterId, success: true });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(errorMessage);
      
      if (onRegister) {
        onRegister({ name, voterId, success: false });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleVoterIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    setVoterId(e.target.value);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleRepeatPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setRepeatPassword(e.target.value);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleRepeatPasswordVisibility = () => {
    setShowRepeatPassword(!showRepeatPassword);
  };

  return (
    <div className={styles.registrationPage}>
    
      <div className={styles.contentWrapper}>
        <div className={styles.container}>
        
          <div className={styles.header}>
            <h1 className={styles.title}>SURTR Verify</h1>
            <p className={styles.subtitle}>Register to participate in the voting process</p>
          </div>

        
          <div className={styles.formCard}>
            <div className={styles.formContainer}>
              <h2 className={styles.formTitle}>Your Information</h2>
              
            
              {error && (
                <div className={styles.errorMessage}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
              
              <form className={styles.form} autoComplete="off">
             
                <input type="text" className={styles.hiddenField} autoComplete="off" />
                <input type="password" className={styles.hiddenField} autoComplete="off" />
                <input type="email" className={styles.hiddenField} autoComplete="off" />
                
              
                <div className={styles.fieldContainer}>
                  <label className={styles.fieldLabel}>Full Name</label>
                  <input
                    type="text"
                    name="registration-fullname"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={handleNameChange}
                    className={styles.fieldInput}
                    disabled={isSubmitting}
                    autoComplete="off"
                    data-lpignore="true"
                  />
                </div>

              
                <div className={styles.fieldContainer}>
                  <label className={styles.fieldLabel}>Voter ID Number</label>
                  <input
                    type="text"
                    name="registration-voterid"
                    placeholder="Enter your voter ID"
                    value={voterId}
                    onChange={handleVoterIdChange}
                    className={styles.fieldInput}
                    disabled={isSubmitting}
                    autoComplete="off"
                    data-lpignore="true"
                  />
                </div>

             
                <div className={styles.fieldContainer}>
                  <label className={styles.fieldLabel}>Password</label>
                  <div className={styles.passwordFieldWrapper}>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="registration-newpassword"
                      placeholder="Enter your password"
                      value={password}
                      onChange={handlePasswordChange}
                      className={styles.fieldInput}
                      disabled={isSubmitting}
                      autoComplete="new-password"
                      data-lpignore="true"
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={togglePasswordVisibility}
                      disabled={isSubmitting}
                    >
                      {showPassword ? <EyeOff className={styles.eyeIcon} /> : <Eye className={styles.eyeIcon} />}
                    </button>
                  </div>
                </div>

             
                <div className={styles.fieldContainer}>
                  <label className={styles.fieldLabel}>Repeat Password</label>
                  <div className={styles.passwordFieldWrapper}>
                    <input
                      type={showRepeatPassword ? "text" : "password"}
                      name="registration-confirmpassword"
                      placeholder="Re-enter your password"
                      value={repeatPassword}
                      onChange={handleRepeatPasswordChange}
                      className={styles.fieldInput}
                      disabled={isSubmitting}
                      autoComplete="new-password"
                      data-lpignore="true"
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={toggleRepeatPasswordVisibility}
                      disabled={isSubmitting}
                    >
                      {showRepeatPassword ? <EyeOff className={styles.eyeIcon} /> : <Eye className={styles.eyeIcon} />}
                    </button>
                  </div>
                </div>

               
                <Button
                  type="button"
                  className={styles.registerButton}
                  onClick={handleSubmit}
                  disabled={!name.trim() || !voterId.trim() || !password.trim() || !repeatPassword.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Registering...' : 'Register'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;