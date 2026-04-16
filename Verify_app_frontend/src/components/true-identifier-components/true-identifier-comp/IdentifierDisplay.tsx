import React from 'react'
import { TriangleAlert } from 'lucide-react'
import styles from '../true-identifier-styled-comp/identifierDisplay.module.css'

interface IdentifierDisplayProps {
  identifier: {
    emoji: string
    word: string
  }
}

export function IdentifierDisplay({ identifier }: IdentifierDisplayProps): React.JSX.Element {
  return (
    <div className={styles.identifierCard}>
      <h2 className={styles.identifierTitle}>True Identifier:</h2>
      
      <div className={styles.identifierDisplayArea}>
        <div className={styles.identifierContent}>
          <div className={styles.emojiDisplay}>
            {identifier.emoji}
          </div>
          
          <div className={styles.wordDisplay}>
            {identifier.word}
          </div>
        </div>
      </div>
      
      <div className={styles.importantSection}>
        <div className={styles.importantHeader}>
          <TriangleAlert className={styles.warningIcon} />
          <span className={styles.importantText}>Important</span>
        </div>
        
        <p className={styles.importantMessage}>
          Carefully memorize this identifier (image and word) to verify your vote later. Do not share this identifier with anyone.
        </p>
      </div>
    </div>
  )
}