import React, { useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { findVoter } from '@/utils/dataService';
import styles from '../login-styled-comp/login.module.css';

interface LoginProps {
  onLogin?: (data: { name: string; voterId: string; success: boolean }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [voterId, setVoterId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !voterId.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const voter = await findVoter(voterId, name, password);
      
      if (voter) {
        console.log('Login successful:', voter);
        localStorage.setItem('surtr_authenticated_voter', JSON.stringify(voter));
        setError('');
        setName('');
        setVoterId('');
        setPassword('');
        
        if (onLogin) {
          onLogin({ name: voter.name, voterId: voter.voterId, success: true });
        }
      } else {
        setError('Invalid credentials. Please check your name, voter ID, and password, or register first.');
        
        if (onLogin) {
          onLogin({ name, voterId, success: false });
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMessage);
      
      if (onLogin) {
        onLogin({ name, voterId, success: false });
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles.loginPage}>
     
      <div className={styles.contentWrapper}>
        <div className={styles.container}>
       
          <div className={styles.header}>
            <h1 className={styles.title}>SURTR Verify</h1>
            <p className={styles.subtitle}>Login using your voter information and the password you set during registration.</p>
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
                    name="login-fullname"
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
                    name="login-voterid"
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
                      name="login-newpassword"
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

               
                <Button
                  type="button"
                  className={styles.loginButton}
                  onClick={handleSubmit}
                  disabled={!name.trim() || !voterId.trim() || !password.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </div>
          </div>

          
          <div className={styles.footer}>
            <p className={styles.footerText}>
              Haven't registered yet? Please register first to access your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;