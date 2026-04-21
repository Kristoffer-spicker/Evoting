import { SignInForm } from "./index";
import styles from '../login-styled-comp/Login.module.css';

export default function Login() {
 

  return (
    <div className={styles.loginPage}>

   
      <div className={styles.contentContainer}>
        <div className={styles.contentWrapper}>
        
          <div className={styles.header}>
            <h2 className={styles.loginTitle}>SURTR Vote</h2>
            <p className={styles.loginSubtitle}>
              Login using your voter information and the password you set during registration on <strong>SURTR Verify</strong> app.
            </p>
          </div>

         
          <SignInForm />

         
          <div className={styles.reminderSection}>
            <p className={styles.reminderText}>
              Have not registered yet? Please register on SURTR Verify first to access your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}