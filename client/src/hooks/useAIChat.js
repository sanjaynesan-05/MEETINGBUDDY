import { useState, useCallback, useRef } from 'react';
import { streamChatMessage } from '../services/chatAPI';

export const useAIChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // waiting for the first token
  const [isStreaming, setIsStreaming] = useState(false); // answer is being written
  const [error, setError] = useState(null);
  const [meetingFilter, setMeetingFilter] = useState('all');
  const messagesRef = useRef([]);

  const sendMessage = useCallback(async (question) => {
    if (!question.trim()) return;

    setError(null);
    setIsLoading(true);

    const userMsg = {
      id: Date.now().toString() + '-user',
      role: 'user',
      content: question,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => {
      const updated = [...prev, userMsg];
      messagesRef.current = updated;
      return updated;
    });

    try {
      const filters = meetingFilter !== 'all' ? { meetingId: meetingFilter } : {};

      const conversationHistory = messagesRef.current
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const aiId = Date.now().toString() + '-ai';
      const updateAi = (patch) => {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === aiId);
          const updated = exists
            ? prev.map((m) => (m.id === aiId ? { ...m, ...(typeof patch === 'function' ? patch(m) : patch) } : m))
            : [...prev, { id: aiId, role: 'assistant', content: '', citations: [], streaming: true, createdAt: new Date().toISOString(), ...(typeof patch === 'function' ? patch({ content: '' }) : patch) }];
          messagesRef.current = updated;
          return updated;
        });
      };

      let finished = false;
      await streamChatMessage(question, { ...filters, conversationHistory }, (event) => {
        if (event.type === 'token') {
          setIsLoading(false);
          setIsStreaming(true);
          updateAi((m) => ({ content: (m.content || '') + event.text }));
        } else if (event.type === 'done') {
          finished = true;
          updateAi({
            content: event.answer,
            citations: event.citations || [],
            confidence: event.confidence || (event.metadata?.chunksUsed > 0 ? 0.8 : 0),
            metadata: event.metadata,
            streaming: false,
          });
        } else if (event.type === 'error') {
          throw new Error(event.message);
        }
      });
      if (!finished) throw new Error('The answer was interrupted. Please try again.');
    } catch (err) {
      console.error('Chat hook error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [meetingFilter]);

  const clearChat = useCallback(() => {
    setMessages([]);
    messagesRef.current = [];
    setError(null);
  }, []);

  const retryLast = useCallback(() => {
    if (messages.length === 0) return;

    const msgsRev = [...messages].reverse();
    const lastUserMsg = msgsRev.find(m => m.role === 'user');

    if (lastUserMsg) {
      setMessages(prev => {
        const newMsgs = [...prev];
        const lastIdx = newMsgs.map(m => m.role).lastIndexOf('user');
        if (lastIdx !== -1) {
          return newMsgs.slice(0, lastIdx);
        }
        return prev;
      });

      setTimeout(() => {
        sendMessage(lastUserMsg.content);
      }, 0);
    }
  }, [messages, sendMessage]);

  return {
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    clearChat,
    retryLast,
    meetingFilter,
    setMeetingFilter
  };
};
