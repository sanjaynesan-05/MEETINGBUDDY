import React from 'react';
import { useSearchContext } from '../../context/SearchContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SearchPagination = React.memo(() => {
  const { pagination, setPage, loading } = useSearchContext();
  const { page, limit, total } = pagination;

  const totalPages = Math.ceil(total / limit) || 1;

  if (total === 0 || totalPages <= 1) return null;

  return (
    <div className="search-pagination">
      <button 
        className="pagination-btn" 
        disabled={page <= 1 || loading}
        onClick={() => setPage(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
        Previous
      </button>
      
      <span className="pagination-info">
        Page {page} of {totalPages}
      </span>
      
      <button 
        className="pagination-btn" 
        disabled={page >= totalPages || loading}
        onClick={() => setPage(page + 1)}
        aria-label="Next page"
      >
        Next
        <ChevronRight size={16} />
      </button>
    </div>
  );
});

export default SearchPagination;
