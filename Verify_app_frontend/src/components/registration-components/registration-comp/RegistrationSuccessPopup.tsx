import React from 'react'
import styles from '../registration-styled-comp/registrationSuccessPopup.module.css'
import successIcon from '@/assets/icons/success.svg'

interface RegistrationSuccessPopupProps {
  isVisible: boolean
}

export function RegistrationSuccessPopup({ isVisible }: RegistrationSuccessPopupProps): React.JSX.Element {
  if (!isVisible) return <></>

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <div className={styles.iconContainer}>
          <div className={styles.checkIcon}>
            <img src={successIcon} alt="Success" width="24" height="24" />
          </div>
        </div>
        <h2 className={styles.message}>Registration Successful!</h2>
      </div>
    </div>
  )
}
