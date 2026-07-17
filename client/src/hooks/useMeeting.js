import { useState, useEffect, useCallback } from 'react';
import { meetingAPI } from '../services/meetingAPI';

export function useMeeting() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await meetingAPI.getAll();
      setMeetings(res.data.meetings);
    } catch (err) {
      console.error('Failed to load meetings:', err);
      setError(err.response?.data?.message || 'Failed to load meetings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const deleteMeeting = useCallback(async (id) => {
    try {
      await meetingAPI.delete(id);
      setMeetings((prev) => prev.filter((m) => m._id !== id));
      return true;
    } catch (err) {
      console.error('Failed to delete meeting:', err);
      throw err;
    }
  }, []);

  return { meetings, loading, error, refetch: fetchMeetings, deleteMeeting };
}
