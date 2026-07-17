import { useState, useCallback } from 'react';
import { sendChatMessage } from '../services/chatAPI';

export const useAIChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meetingFilter, setMeetingFilter] = useState('all');
  
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
    
    setMessages((prev) => [...prev, userMsg]);
    
    try {
      const filters = meetingFilter !== 'all' ? { meetingId: meetingFilter } : {};
      const response = await sendChatMessage(question, filters);
      
      if (response.success) {
        const aiMsg = {
          id: response.metadata?.requestId || Date.now().toString() + '-ai',
          role: 'assistant',
          content: response.answer,
          citations: response.citations,
          confidence: response.confidence,
          metadata: response.metadata,
          createdAt: response.metadata?.generatedAt || new Date().toISOString()
        };
        
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error(response.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('Chat hook error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [meetingFilter]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const retryLast = useCallback(() => {
    if (messages.length === 0) return;
    
    // Find the last user message
    const msgsRev = [...messages].reverse();
    const lastUserMsg = msgsRev.find(m => m.role === 'user');
    
    if (lastUserMsg) {
      // Remove it from current state so we can re-add it in sendMessage flow
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
    error,
    sendMessage,
    clearChat,
    retryLast,
    meetingFilter,
    setMeetingFilter
  };
};
