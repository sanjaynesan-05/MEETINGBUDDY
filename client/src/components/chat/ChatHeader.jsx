import React, { useState, useEffect } from 'react';
import { Bot, Filter } from 'lucide-react';
import { meetingAPI } from '../../services/meetingAPI';

const ChatHeader = ({ meetingFilter, setMeetingFilter }) => {
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    meetingAPI.getAll().then(res => {
      if (res.data.meetings) setMeetings(res.data.meetings);
    }).catch(() => {});
  }, []);

  return (
    <header className="chat-header">
      <div className="chat-header-title">
        <div className="chat-header-icon">
          <Bot size={20} />
        </div>
        <span>AI Assistant</span>
      </div>

      <div className="chat-header-filter">
        <Filter size={16} />
        <select
          value={meetingFilter}
          onChange={(e) => setMeetingFilter(e.target.value)}
          className="chat-header-select"
        >
          <option value="all">All Meetings</option>
          {meetings.map(m => (
            <option key={m._id} value={m._id}>{m.title}</option>
          ))}
        </select>
      </div>
    </header>
  );
};

export default ChatHeader;
