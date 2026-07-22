import React from 'react';
import { useSearchContext } from '../../context/SearchContext';

const HighlightedSnippet = React.memo(({ text }) => {
  const { searchState } = useSearchContext();
  const query = searchState.query;

  if (!query || !text) {
    return <span>{text}</span>;
  }

  // Safely split text by the query, case-insensitive
  const parts = text.split(new RegExp(`(${query})`, 'gi'));

  return (
    <span className="highlighted-snippet">
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() 
          ? <mark key={i} className="search-highlight">{part}</mark> 
          : part
      )}
    </span>
  );
});

export default HighlightedSnippet;
