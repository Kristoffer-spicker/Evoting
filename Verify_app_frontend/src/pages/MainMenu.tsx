import React from 'react'
import { MainMenuContent, MainMenuNavigation } from '@/components/main-menu-components/main-menu-comp'
import styles from '@/components/main-menu-components/main-menu-styled-comp/mainMenu.module.css'

export function MainMenu(): React.JSX.Element {
  return (
    <div className={styles.mainMenuPage}>
      <MainMenuNavigation backPath="/qr-code" />
      <MainMenuContent />
    </div>
  )
}
