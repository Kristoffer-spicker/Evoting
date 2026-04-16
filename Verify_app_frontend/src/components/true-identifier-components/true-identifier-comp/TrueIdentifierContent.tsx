import React from 'react'
import { InstructionSection } from './InstructionSection'
import { IdentifierDisplay } from './IdentifierDisplay'
import { NextStepSection } from './NextStepSection'
import styles from '../true-identifier-styled-comp/trueIdentifier.module.css'

interface TrueIdentifierContentProps {
  identifier: {
    emoji: string
    word: string
  }
  onOk: () => void
}

export function TrueIdentifierContent({ identifier, onOk }: TrueIdentifierContentProps): React.JSX.Element {
  return (
    <div className={styles.contentContainer}>
      <div className={styles.mainGrid}>
        <InstructionSection identifier={identifier} />
        <IdentifierDisplay identifier={identifier} />
      </div>
      <NextStepSection onContinue={onOk} />
    </div>
  )
}
