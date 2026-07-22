import React from 'react';

export default function SearchSkeleton() {
  // Render 5 skeleton cards as requested
  const skeletons = Array.from({ length: 5 });

  return (
    <div className="search-results-list">
      {skeletons.map((_, i) => (
        <div key={i} className="search-card skeleton-card">
          <div className="search-card-header">
            <div className="skeleton-line" style={{ width: '40%', height: '24px', marginBottom: 0 }} />
            <div className="skeleton-line" style={{ width: '80px', height: '20px', marginBottom: 0, borderRadius: '12px' }} />
          </div>
          <div className="search-card-content mt-4">
            <div className="skeleton-line" style={{ width: '200px' }} />
            <div className="skeleton-line" style={{ width: '100%', marginTop: '16px' }} />
            <div className="skeleton-line" style={{ width: '80%' }} />
          </div>
          <div className="search-card-actions mt-4">
            <div className="skeleton-line" style={{ width: '120px', height: '36px', borderRadius: '4px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
