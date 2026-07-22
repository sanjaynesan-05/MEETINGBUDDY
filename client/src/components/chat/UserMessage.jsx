import React from 'react';

const UserMessage = ({ content }) => {
  return (
    <div className="user-msg-row">
      <div className="user-msg-bubble">
        {content}
      </div>
    </div>
  );
};

export default UserMessage;
