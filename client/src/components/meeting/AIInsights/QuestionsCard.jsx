import { HelpCircle, MessageCircleQuestion } from "lucide-react";

export default function QuestionsCard({ questions }) {
  const answered = questions?.answered || [];
  const unanswered = questions?.unanswered || [];

  if (answered.length === 0 && unanswered.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: "var(--space-6)", display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
      {answered.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, marginBottom: "var(--space-4)", display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle size={20} color="var(--md-success)" />
            Answered Questions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {answered.map((q, i) => (
              <div key={i} className="question-item">
                <HelpCircle size={18} color="var(--md-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: 'var(--text-base)', color: 'var(--md-on-surface)' }}>{q}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {unanswered.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, marginBottom: "var(--space-4)", display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageCircleQuestion size={20} color="var(--md-warning)" />
            Unanswered Questions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {unanswered.map((q, i) => (
              <div key={i} className="question-item">
                <MessageCircleQuestion size={18} color="var(--md-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: 'var(--text-base)', color: 'var(--md-on-surface)' }}>{q}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
