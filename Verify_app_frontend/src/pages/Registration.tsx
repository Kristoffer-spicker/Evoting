import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Registration as RegistrationComponent } from '@/components/registration-components/registration-comp'
import { RegistrationSuccessPopup } from '@/components/registration-components/registration-comp/RegistrationSuccessPopup'

export function Registration(): React.JSX.Element {
  const navigate = useNavigate()
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)

  const handleRegister = (data: { name: string; voterId: string; success: boolean }) => {
    if (data.success) {
      setShowSuccessPopup(true)
      
      
      setTimeout(() => {
        navigate('/qr-code', {
          state: {
            voterId: data.voterId
          }
        })
      }, 4000)
    }
  }

  return (
    <>
      <RegistrationComponent onRegister={handleRegister} />
      <RegistrationSuccessPopup isVisible={showSuccessPopup} />
    </>
  )
}