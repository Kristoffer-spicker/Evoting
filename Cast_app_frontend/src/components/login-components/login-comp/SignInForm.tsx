import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { validateVoterCredentials } from '../../../utils';
import styles from '../login-styled-comp/SignInForm.module.css';

export interface SignInFormProps {
  onSubmit?: (data: { name: string; voterId: string }) => void;
}

export default function SignInForm({ onSubmit }: SignInFormProps) {
  const [name, setName] = useState("");
  const [voterId, setVoterId] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async () => {
 
    setErrorMessage("");
    
 
    if (!name.trim() || !voterId.trim() || !password.trim()) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    const formData = { name: name.trim(), voterId: voterId.trim() };
    
    try {
      
      const voter = await validateVoterCredentials(formData.name, formData.voterId, password.trim());
      
      if (!voter) {
        setErrorMessage('Invalid credentials. Please verify your name, voter ID, and password are entered correctly.');
        return;
      }

    
      if (voter.hasVoted === true) {
      
        if (voter.hasConfirmed === true) {
       
          navigate('/aftervote', { 
            state: { userName: formData.name, voterId: formData.voterId },
            replace: true 
          });
        } else {
        
          
          navigate('/confirmation', { 
            state: { 
              userName: formData.name, 
              voterId: formData.voterId,
              selectedCandidate: voter.chosen_candidate || 'Unknown'
            },
            replace: true 
          });
        }
        return;
      }

      console.log("Sign In successful", formData);
      
      if (onSubmit) {
        onSubmit(formData);
      }
      
     
      navigate('/scanqr', { state: { userName: formData.name, voterId: formData.voterId } });
      
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('Unable to verify credentials. Please check your connection and try again.');
    }
  };


  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (errorMessage) setErrorMessage("");
  };

  const handleVoterIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVoterId(e.target.value);
    if (errorMessage) setErrorMessage("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errorMessage) setErrorMessage("");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles.formCard}>
    
      {errorMessage && (
        <div className={styles.errorMessage}>
          <AlertCircle className={styles.errorIcon} />
          <span className={styles.errorText}>{errorMessage}</span>
        </div>
      )}

      <form autoComplete="off">
       
        <input type="text" className={styles.hiddenField} autoComplete="off" />
        <input type="password" className={styles.hiddenField} autoComplete="off" />
        <input type="email" className={styles.hiddenField} autoComplete="off" />

       
        <div className={styles.fieldGroup}>
          <label htmlFor="name" className={styles.fieldLabel}>
            Name
          </label>
          <input
            id="name"
            type="text"
            name="vote-signin-name"
            placeholder="Enter your name"
            value={name}
            onChange={handleNameChange}
            className={styles.fieldInput}
            autoComplete="off"
            data-lpignore="true"
          />
        </div>

       
        <div className={styles.fieldGroup}>
          <label htmlFor="voterId" className={styles.fieldLabel}>
            Voter ID Number
          </label>
          <input
            id="voterId"
            type="text"
            name="vote-signin-voterid"
            placeholder="Enter your Voter ID number"
            value={voterId}
            onChange={handleVoterIdChange}
            className={styles.fieldInput}
            autoComplete="off"
            data-lpignore="true"
          />
        </div>

     
        <div className={styles.fieldGroup}>
          <label htmlFor="password" className={styles.fieldLabel}>
            Password
          </label>
          <div className={styles.passwordFieldWrapper}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              name="vote-signin-password"
              placeholder="Enter your password"
              value={password}
              onChange={handlePasswordChange}
              className={styles.fieldInput}
              autoComplete="new-password"
              data-lpignore="true"
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <EyeOff className={styles.eyeIcon} /> : <Eye className={styles.eyeIcon} />}
            </button>
          </div>
        </div>

        {/* Sign In Button */}
        <button
          type="button"
          onClick={handleSignIn}
          className={styles.submitButton}
        >
          Login
        </button>
      </form>
    </div>
  );
}