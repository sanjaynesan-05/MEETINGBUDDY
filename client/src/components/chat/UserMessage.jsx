import React from 'react';

const UserMessage = ({ content }) => {
  return (
    <div className="flex flex-col items-end gap-1 mb-6 max-w-3xl ml-auto">
      <div className="px-5 py-3.5 bg-indigo-600 text-white rounded-2xl rounded-tr-sm shadow-sm max-w-full overflow-hidden break-words">
        {content}
      </div>
    </div>
  );
};

export default UserMessage;
