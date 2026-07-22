import React, { useEffect } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatHeader from './ChatHeader';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';
import { useAIChat } from '../../hooks/useAIChat';

const ChatLayout = ({ initialMeetingId = 'all' }) => {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    retryLast,
    meetingFilter,
    setMeetingFilter
  } = useAIChat();

  useEffect(() => {
    if (initialMeetingId && initialMeetingId !== 'all') {
      setMeetingFilter(initialMeetingId);
    }
  }, [initialMeetingId, setMeetingFilter]);

  return (
    <div className="chat-layout">
      <ChatSidebar onNewChat={clearChat} />

      <div className="chat-main">
        <ChatHeader
          meetingFilter={meetingFilter}
          setMeetingFilter={setMeetingFilter}
        />

        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          error={error}
          onRetry={retryLast}
          onSuggestSelect={sendMessage}
        />

        <div className="chat-input-area">
          <ChatInput onSend={sendMessage} disabled={isLoading} />
          <p className="chat-disclaimer">
            AI answers may vary. Always verify important information with the original transcript.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatLayout;
