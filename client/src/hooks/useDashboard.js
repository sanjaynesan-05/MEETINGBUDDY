import { useState, useEffect, useCallback } from 'react';
import { dashboardAPI } from '../services/dashboardAPI';

export function useDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await dashboardAPI.getDashboardData();
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { data, loading, error, refetch: fetchDashboardData };
}
