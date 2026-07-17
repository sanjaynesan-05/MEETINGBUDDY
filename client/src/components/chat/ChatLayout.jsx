import React from 'react';
import ChatSidebar from './ChatSidebar';
import ChatHeader from './ChatHeader';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';
import { useAIChat } from '../../hooks/useAIChat';

const ChatLayout = () => {
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

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950 font-sans overflow-hidden">
      <ChatSidebar onNewChat={clearChat} />
      
      <div className="flex-1 flex flex-col h-full relative">
        <ChatHeader 
          meetingFilter={meetingFilter}
          setMeetingFilter={setMeetingFilter}
        />
        
        <main className="flex-1 overflow-hidden flex flex-col relative bg-white dark:bg-gray-950">
          <ChatWindow 
            messages={messages}
            isLoading={isLoading}
            error={error}
            onRetry={retryLast}
            onSuggestSelect={sendMessage}
          />
          
          <div className="p-4 sm:p-6 bg-gradient-to-t from-white via-white dark:from-gray-950 dark:via-gray-950 to-transparent sticky bottom-0">
            <div className="max-w-4xl mx-auto">
              <ChatInput onSend={sendMessage} disabled={isLoading} />
              <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
                AI answers may vary. Always verify important information with the original transcript.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChatLayout;
