import { useState, useEffect, useCallback } from 'react';
import { analyticsAPI } from '../services/analyticsAPI';

export function useAnalytics(filters = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Stable stringified version of filters to prevent infinite re-renders
  const filtersKey = JSON.stringify(filters);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await analyticsAPI.getDashboardData(filters);
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Unable to load analytics.');
    } finally {
      setLoading(false);
    }
  }, [filtersKey]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { data, loading, error, refetch: fetchAnalytics };
}
