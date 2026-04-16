import React from 'react';
import styles from '../ballot-styled-comp/InstructionSection.module.css';

const InstructionSection: React.FC = () => {
  return (
    <div className={styles.instructionContainer}>
      <h3 className={styles.sectionTitle}>Instructions for Coercion Protection</h3>
      
     
      <div className={styles.instructionContent}>
         <p className={styles.instructionText}>
          Keep the <strong>Identifiers for All Candidates</strong> page open in the SURTR Verify app on your computer while reviewing this page.
        </p>

         <p className={styles.instructionText}>
         Your <strong>Personalized Ballot</strong> is shown below. Each candidate in this ballot is shown with a position number.
        </p>

        
        <p className={styles.instructionText}>
          Use the position number shown next to a candidate in this ballot to view that candidate’s identifier in the <strong>Identifiers for All Candidates</strong> page on your computer.
        </p>



        
       

      </div>
    </div>
  );
};

export default InstructionSection;
