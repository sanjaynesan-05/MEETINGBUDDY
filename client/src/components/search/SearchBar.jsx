import React, { useState, useEffect } from 'react';
import { useSearchContext } from '../../context/SearchContext';
import { Search, X, Loader2 } from 'lucide-react';

export default function SearchBar() {
  const { searchState, setQuery, loading } = useSearchContext();
  
  // Local state for immediate input feedback before debounce kicks in
  const [inputValue, setInputValue] = useState(searchState.query || '');

  // Sync back to local state if URL changes externally
  useEffect(() => {
    setInputValue(searchState.query || '');
  }, [searchState.query]);

  const handleChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setQuery(val);
  };

  const handleClear = () => {
    setInputValue('');
    setQuery('');
  };

  return (
    <div className="search-bar-container">
      <div className="search-input-wrapper">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          className="search-input"
          placeholder="Search meetings, decisions, action items..."
          value={inputValue}
          onChange={handleChange}
        />
        {inputValue && (
          <button className="search-clear-btn" onClick={handleClear} aria-label="Clear search">
            <X size={16} />
          </button>
        )}
        {loading && <Loader2 className="search-loading-icon spin" size={20} />}
      </div>
    </div>
  );
}
