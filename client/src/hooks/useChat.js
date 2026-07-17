import { useState, useCallback } from 'react';
import { chatAPI } from '../services/chatAPI';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendMessage = useCallback(async (text, contextId = null) => {
    if (!text.trim()) return;

    const userMessage = { id: Date.now(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError('');

    try {
      // Mock call or real API call for future Chat feature
      const res = await chatAPI.sendMessage({ text, contextId });
      const assistantMessage = { id: Date.now() + 1, role: 'assistant', content: res.data.reply };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { messages, loading, error, sendMessage };
}
