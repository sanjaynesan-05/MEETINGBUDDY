import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ChatLayout from '../components/chat/ChatLayout';

const AIChatPage = () => {
  const [searchParams] = useSearchParams();
  const initialMeetingId = searchParams.get('meeting') || 'all';

  return (
    <div className="page-content" style={{ padding: 0 }}>
      <div className="ai-chat-page">
        <ChatLayout initialMeetingId={initialMeetingId} />
      </div>
    </div>
  );
};

export default AIChatPage;
