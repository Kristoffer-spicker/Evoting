import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Login as LoginComponent } from '@/components/login-components/login-comp'
import { hasVoterSeenTrueIdentifier } from '@/utils/dataService'
import { hasVoterSeenAllIdentifiers } from '@/utils/allIdentifiersEnforcement'

export function Login(): React.JSX.Element {
  const navigate = useNavigate()

  const handleLogin = async (data: { name: string; voterId: string; success: boolean }) => {
    if (data.success) {
      console.log('Login successful for:', data.name);
      
      try {
        const hasSeenTrueId = await hasVoterSeenTrueIdentifier(data.voterId)
        
        if (!hasSeenTrueId) {
          console.log('Has not seen true identifier, redirecting to qr-code')
          navigate('/qr-code')
        } else {
          const hasSeenAllIds = await hasVoterSeenAllIdentifiers(data.voterId)
          
          if (!hasSeenAllIds) {
            console.log('Has seen true identifier but not all identifiers, redirecting to all-identifiers')
            navigate('/all-identifiers')
          } else {
            console.log('Has seen both, redirecting to complete')
            navigate('/complete')
          }
        }
      } catch (error) {
        console.error('Error checking voter progress:', error)
        navigate('/qr-code')
      }
    }
  }

  return <LoginComponent onLogin={handleLogin} />
}