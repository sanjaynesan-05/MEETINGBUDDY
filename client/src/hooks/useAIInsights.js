import { useState, useEffect, useCallback } from 'react';
import { meetingAPI } from '../services/meetingAPI';

export function useAIInsights(meetingId, meetingStatus) {
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
    // Fetch if status is completed, or if status isn't provided (fallback)
    if (!meetingStatus || meetingStatus === 'completed') {
      fetchAnalysis();
    }
  }, [fetchAnalysis, meetingStatus]);

  return { analysis, loading, error, refetch: fetchAnalysis };
}
