import React from 'react';
import { Search } from 'lucide-react';
import styles from '../ballot-styled-comp/SearchSection.module.css';

interface SearchSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFind: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

const SearchSection: React.FC<SearchSectionProps> = ({
  searchQuery,
  onSearchChange,
  onFind,
  onKeyPress
}) => {
  return (
    <div className={styles.searchContainer}>
      <h3 className={styles.searchTitle}>Find the position of the candidate you are being coerced to vote for:</h3>
      <div className={styles.searchInputGroup}>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            placeholder="Enter candidate name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyPress={onKeyPress}
            className={styles.searchInput}
          />
        </div>
        <button
          onClick={onFind}
          className={styles.findButton}
          disabled={searchQuery.trim() === ''}
        >
          <Search className={styles.searchIcon} />
          <span>Find</span>
        </button>
      </div>
    </div>
  );
};

export default SearchSection;