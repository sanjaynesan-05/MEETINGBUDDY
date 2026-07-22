import React from 'react';
import { MessageSquare, Plus } from 'lucide-react';

const ChatSidebar = ({ onNewChat }) => {
  return (
    <aside className="chat-sidebar">
      <div className="chat-sidebar-header">
        <button onClick={onNewChat} className="chat-new-btn">
          <Plus size={18} />
          New Chat
        </button>
      </div>

      <div className="chat-sidebar-body">
        <div className="chat-sidebar-title">Recent Session</div>

        <button className="chat-session-item">
          <MessageSquare size={16} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Current Conversation
          </span>
        </button>
      </div>
    </aside>
  );
};

export default ChatSidebar;
