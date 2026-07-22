import React from 'react';
import { Search } from 'lucide-react';

export default function SearchEmpty() {
  return (
    <div className="search-empty-state">
      <div className="empty-icon-wrapper">
        <Search size={48} className="empty-icon" />
      </div>
      <h2>No meetings found</h2>
      <p>Try adjusting your filters or searching for a different keyword.</p>
    </div>
  );
}
