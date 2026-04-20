import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpSidebar, HelpContent } from '@/components/help-components/help-comp';
import styles from '@/components/help-components/help-styled-comp/help.module.css';

const sections = [
  { id: 'about', label: 'About the SURTR Voting System' },
  { id: 'two-devices', label: 'Why SURTR Uses Two Devices' },
  { id: 'different', label: 'What Makes SURTR Different' },
  { id: 'key-concepts', label: 'Key Concepts in SURTR' },
  { id: 'identifier', label: 'What is an Identifier?' },
  { id: 'true-identifier', label: 'What is the True Identifier?' },
  { id: 'all-identifiers', label: 'Identifiers for All Candidates' },
  { id: 'coercion', label: 'What is Coercion?' },
  { id: 'voting-guide', label: 'Step-by-Step Voting Guide' },
  { id: 'verify', label: 'How to Verify Your Vote (Post-Election)' },
  { id: 'never-voted', label: 'What if I followed Verify but never voted?' },
];

export function Help() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('about');
  const contentRef = useRef<HTMLDivElement>(null);

  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;

      const scrollPosition = contentRef.current.scrollTop + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i].id);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    const content = contentRef.current;
    if (content) {
      content.addEventListener('scroll', handleScroll);
      return () => content.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element && contentRef.current) {
      const offset = element.offsetTop - contentRef.current.offsetTop;
      contentRef.current.scrollTo({
        top: offset,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className={styles.helpPage}>
      <HelpSidebar
        sections={sections}
        activeSection={activeSection}
        onSectionClick={scrollToSection}
        onBackClick={handleBack}
      />
      <HelpContent ref={contentRef} />
    </div>
  );
}

export default Help;
