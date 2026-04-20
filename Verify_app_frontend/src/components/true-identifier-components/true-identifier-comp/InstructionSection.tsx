import React from 'react'
import styles from '../true-identifier-styled-comp/instructionSection.module.css'

interface InstructionSectionProps {
  identifier: {
    emoji: string
    word: string
  }
}

export function InstructionSection({ identifier }: InstructionSectionProps): React.JSX.Element {
  return (
    <div className={styles.instructionCard}>
      <div className={styles.instructionBox}>
        <h2 className={styles.instructionTitle}>Instructions</h2>
        
        <p className={styles.instructionText}>
          The True Identifier is what lets you check later that your vote was recorded correctly, without revealing your choice to others.
        </p>

        <p className={styles.instructionText}>
           Your vote’s True Identifier is shown on the right as a pair consisting of a word and an image.
        </p>

        
        <p className={styles.instructionText}>
          You must remember this identifier to verify your vote. Without it, verification will not be possible.
        </p>

        <p className={styles.instructionText}>
          When you verify your vote, this identifier will appear only next to the candidate you voted for.
        </p>
        
        <p className={styles.instructionText}>
           If this identifier appears next to the candidate you voted for in the verification results, your vote was recorded correctly.
        </p>

         <p className={styles.instructionText}>
           Do not share this identifier with anyone. Sharing this identifier can reveal your actual choice to others.
        </p>
          
        <div className={styles.exampleSection}>
          <h3 className={styles.exampleTitle}>Example verification result:</h3>
          
          <p className={styles.exampleDescription}>
            If you voted for <strong>John Smith,</strong> the verification result would appear as follows during verification:
          </p>
          
          <div className={styles.tableContainer}>
            <table className={styles.verificationTable}>
              <thead>
                <tr>
                  <th className={styles.tableHeaderIdentifier}>Identifiers</th>
                  <th className={styles.tableHeaderCandidate}>Candidate Names</th>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.tableRow}>
                  <td className={styles.tableCell}>
                    <div className={styles.tableIdentifier}>
                      <span className={styles.tableDiceEmoji}>🦓</span>
                      <span className={styles.tableDiceText}>Zebra</span>
                    </div>
                  </td>
                  <td className={styles.tableCell}>Sarah Peterson</td>
                </tr>
                <tr className={styles.tableRow}>
                  <td className={styles.tableCell}>
                    <div className={styles.highlightedIdentifier}>
                      <div className={styles.arrowContainer}>
                        <div className={styles.arrowLine}></div>
                        <div className={styles.arrowHead}></div>
                      </div>
                      <div className={styles.identifierCircle}>
                        <span className={styles.tableDiceEmoji}>{identifier.emoji}</span>
                        <span className={styles.tableDiceText}>{identifier.word}</span>
                      </div>
                    </div>
                  </td>
                  <td className={styles.tableCell}>John Smith</td>
                </tr>
                <tr className={styles.tableRow}>
                  <td className={styles.tableCell}>
                    <div className={styles.tableIdentifier}>
                      <span className={styles.tableDiceEmoji}>🚀</span>
                      <span className={styles.tableDiceText}>Rocket</span>
                    </div>
                  </td>
                  <td className={styles.tableCell}>George Brown</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className={styles.noticeSection}>
            <span className={styles.noticeLabel}><strong>Notice:</strong> Your True Identifier (</span>
            <span className={styles.noticeIdentifier}>{identifier.emoji} {identifier.word}</span>
            <span className={styles.noticeLabel}>) appears next to the candidate you voted for </span>
            <span className={styles.noticeCandidate}>(John Smith).</span>
            <span className={styles.noticeLabel}> This confirms that your vote was recorded correctly while keeping your choice private.</span>
          </div>
          
          <p className={styles.nbSection}>
           <strong>N.B.</strong> This example shows only the verification result format. The candidate names shown here are examples and are not real candidates in the election.
          </p>
        </div>
      </div>
    </div>
  )
}