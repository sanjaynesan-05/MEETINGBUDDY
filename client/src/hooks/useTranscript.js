import { useState, useEffect, useCallback, useRef } from 'react';
import { meetingAPI } from '../services/meetingAPI';

export function useTranscript(meetingId) {
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const pollRef = useRef(null);

  const fetchMeeting = useCallback(async () => {
    if (!meetingId) return null;
    try {
      const res = await meetingAPI.getById(meetingId);
      setMeeting(res.data.meeting);
      setError('');
      return res.data.meeting;
    } catch (err) {
      console.error('Failed to fetch meeting:', err);
      setError(err.response?.data?.message || 'Failed to load meeting.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const m = await fetchMeeting();
      if (m && (m.status === 'completed' || m.status === 'failed')) {
        stopPolling();
      }
    }, 3000);
  }, [fetchMeeting, stopPolling]);

  useEffect(() => {
    fetchMeeting().then((m) => {
      if (m && (m.status === 'transcribing' || m.status === 'uploaded')) {
        startPolling();
      }
    });
    return () => stopPolling();
  }, [fetchMeeting, startPolling, stopPolling]);

  return { meeting, loading, error, fetchMeeting };
}
