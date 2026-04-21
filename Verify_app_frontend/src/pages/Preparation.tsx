import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Preparation as PreparationComponent } from '@/components/preparation-components/preparation-comp'
import { MainMenuNavigation } from '@/components/main-menu-components/main-menu-comp'
import styles from '@/components/main-menu-components/main-menu-styled-comp/mainMenu.module.css'

export function Preparation(): React.JSX.Element {
  const navigate = useNavigate()

  const handleNext = () => {
    navigate('/qr-code')
  }

  return (
    <div className={styles.mainMenuPage}>
      <MainMenuNavigation backPath="/" />
      <PreparationComponent onNext={handleNext} />
    </div>
  )
}
