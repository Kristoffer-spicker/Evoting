import React from 'react';
import styles from '../ballot-styled-comp/ExampleSection.module.css';

const ExampleSection: React.FC = () => {
  return (
    <div className={styles.exampleContainer}>
      <h3 className={styles.sectionTitle}>Example: How to view an Identifier</h3>
      <div className={styles.exampleContent}>
        <p className={styles.exampleText}>
          If you are coerced to verify your vote for <strong>George Brown</strong>, knowing that candidate's identifier in advance will help with later vote verification for that candidate.
        </p>
        <p className={styles.exampleSubtitle}>Follow these steps to see the identifier for <strong>George Brown</strong>:</p>
        <div className={styles.stepsList}>
          <p className={styles.stepText}>
            <strong>1.</strong> In the ballot below, find <strong>George Brown</strong>, and note the position number.
          </p>
          <p className={styles.stepExample}>
            e.g., <strong><em>George Brown</em></strong> is positioned at number <span className={styles.numberBadge}>9</span>
          </p>
          <p className={styles.stepText}>
            <strong>2.</strong> In the <strong><em>Identifiers for All Candidates</em></strong> page on your computer, use number <strong>9</strong> to view the corresponding identifier.
          </p>
        </div>
        <p className={styles.conclusionText}>
          The identifier you see will be associated with <strong>George Brown</strong> in the verification results, allowing verification without revealing your actual choice.
        </p>
        
        <p className={styles.nbSection}>
         <strong>N.B.</strong> The candidate name used in this example is not a real candidate in the election and is used only to explain the scenario.
        </p>
      </div>
    </div>
  );
};

export default ExampleSection;
