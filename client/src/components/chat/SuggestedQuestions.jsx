import React from 'react';
import { Sparkles } from 'lucide-react';

const SuggestedQuestions = ({ onSelect }) => {
  const questions = [
    "What decisions were made?",
    "Who owns this task?",
    "Summarize discussion.",
    "List action items."
  ];

  return (
    <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-sm)', color: 'var(--md-on-surface-variant)', fontWeight: 500, justifyContent: 'center' }}>
        <Sparkles size={16} color="var(--md-primary)" />
        Suggested Questions
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
        {questions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(q)}
            className="suggested-btn"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedQuestions;
