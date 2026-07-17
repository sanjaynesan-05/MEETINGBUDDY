import React from 'react';
import UserMessage from './UserMessage';
import AIMessage from './AIMessage';

const ChatMessage = ({ message }) => {
  if (message.role === 'user') {
    return <UserMessage content={message.content} />;
  }
  
  return (
    <AIMessage 
      id={message.id}
      content={message.content}
      confidence={message.confidence}
      citations={message.citations}
      metadata={message.metadata}
    />
  );
};

export default ChatMessage;
