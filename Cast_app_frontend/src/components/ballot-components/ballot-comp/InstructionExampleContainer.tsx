import React from 'react';
import InstructionSection from './InstructionSection';
import ExampleSection from './ExampleSection';
import styles from '../ballot-styled-comp/InstructionExampleContainer.module.css';

const InstructionExampleContainer: React.FC = () => {
  return (
    <div className={styles.container}>
      <InstructionSection />
      {/* <ExampleSection /> */}
    </div>
  );
};

export default InstructionExampleContainer;
