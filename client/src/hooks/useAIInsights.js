import { useState, useEffect, useCallback } from 'react';
import { meetingAPI } from '../services/meetingAPI';

export function useAIInsights(meetingId) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalysis = useCallback(async () => {
    if (!meetingId) return;
    try {
      setLoading(true);
      setError('');
      const res = await meetingAPI.getAnalysis(meetingId);
      setAnalysis(res.data.data.analysis);
    } catch (err) {
      console.error('Failed to load AI analysis:', err);
      setError('Failed to load AI insights.');
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  return { analysis, loading, error, refetch: fetchAnalysis };
}
