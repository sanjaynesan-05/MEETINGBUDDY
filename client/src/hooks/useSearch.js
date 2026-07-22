import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchAPI } from '../services/searchAPI';

export function useSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state from URL
  const initialQuery = searchParams.get('q') || '';
  const initialMeetingType = searchParams.get('meetingType') || '';
  const initialDateRange = searchParams.get('dateRange') || '';
  const initialPage = parseInt(searchParams.get('page'), 10) || 1;
  const initialLimit = parseInt(searchParams.get('limit'), 10) || 10;
  const initialFrom = searchParams.get('from') || '';
  const initialTo = searchParams.get('to') || '';

  const [searchState, setSearchState] = useState({
    query: initialQuery,
    meetingType: initialMeetingType,
    dateRange: initialDateRange,
    from: initialFrom,
    to: initialTo,
    page: initialPage,
    limit: initialLimit,
    mode: 'Keyword' // Reserved for future Hybrid search
  });

  const [results, setResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Sync state changes to URL
  const updateURL = useCallback((newState) => {
    const params = new URLSearchParams();
    if (newState.query) params.set('q', newState.query);
    if (newState.meetingType) params.set('meetingType', newState.meetingType);
    if (newState.dateRange) params.set('dateRange', newState.dateRange);
    if (newState.from) params.set('from', newState.from);
    if (newState.to) params.set('to', newState.to);
    if (newState.page > 1) params.set('page', newState.page);
    if (newState.limit !== 10) params.set('limit', newState.limit);
    
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  // Execute search
  const executeSearch = useCallback(async (currentState) => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Don't search if query is empty and no filters are applied
    if (!currentState.query && !currentState.meetingType && !currentState.from && !currentState.to) {
      setResults([]);
      setStats(null);
      setPagination({ page: 1, limit: 10, total: 0 });
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const data = await searchAPI.searchMeetings(
        {
          q: currentState.query,
          meetingType: currentState.meetingType,
          from: currentState.from,
          to: currentState.to,
          page: currentState.page,
          limit: currentState.limit,
        },
        controller.signal
      );

      setResults(data.results || []);
      setStats(data.stats || null);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0 });
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        // Request was cancelled, ignore
        return;
      }
      setError(err.response?.data?.message || 'Unable to search meetings.');
      setResults([]);
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, []);

  // Effect to handle debouncing and state changes
  useEffect(() => {
    updateURL(searchState);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      executeSearch(searchState);
    }, 400); // 400ms debounce

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchState, updateURL, executeSearch]);

  // Handle URL changes (e.g. Back button)
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    const urlPage = parseInt(searchParams.get('page'), 10) || 1;
    const urlMeetingType = searchParams.get('meetingType') || '';
    
    setSearchState(prev => {
      if (prev.query !== urlQuery || prev.page !== urlPage || prev.meetingType !== urlMeetingType) {
        return {
          ...prev,
          query: urlQuery,
          page: urlPage,
          meetingType: urlMeetingType
        };
      }
      return prev;
    });
  }, [searchParams]);

  const setQuery = (query) => {
    setSearchState(prev => ({ ...prev, query, page: 1 }));
  };

  const setFilters = (filters) => {
    setSearchState(prev => ({ ...prev, ...filters, page: 1 }));
  };

  const setPage = (page) => {
    setSearchState(prev => ({ ...prev, page }));
  };

  const clearSearch = () => {
    setSearchState({
      query: '',
      meetingType: '',
      dateRange: '',
      from: '',
      to: '',
      page: 1,
      limit: 10,
      mode: 'Keyword'
    });
  };

  const refetch = () => executeSearch(searchState);

  return {
    searchState,
    results,
    stats,
    pagination,
    loading,
    error,
    setQuery,
    setFilters,
    setPage,
    clearSearch,
    refetch
  };
}
