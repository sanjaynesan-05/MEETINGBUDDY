import React from 'react';
import HighlightedSnippet from './HighlightedSnippet';

const SearchCard = React.memo(({ result }) => {
  const { meetingTitle, meetingType, matchType, score, snippetField, snippet, createdAt } = result;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    }).format(new Date(dateString));
  };

  return (
    <div className="search-card">
      <div className="search-card-header">
        <div className="search-card-title-group">
          <h3 className="search-card-title">{meetingTitle || 'Untitled Meeting'}</h3>
          <span className="search-card-badge">{meetingType}</span>
        </div>
        <div className="search-card-meta">
          <span className="search-card-date">{formatDate(createdAt)}</span>
        </div>
      </div>
      
      <div className="search-card-content">
        <div className="search-card-match-info">
          <span className="search-match-type">{matchType}</span>
          <span className="search-score">Score: {Math.round(score)}</span>
          <span className="search-snippet-field">Field: {snippetField}</span>
        </div>
        
        <p className="search-snippet">
          <HighlightedSnippet text={snippet} />
        </p>
      </div>
      
      <div className="search-card-actions">
        <button className="btn btn-outline search-open-btn" disabled>
          Open Meeting
        </button>
      </div>
    </div>
  );
});

export default SearchCard;
