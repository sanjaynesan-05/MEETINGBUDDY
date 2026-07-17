import { FileText, AlertTriangle, HelpCircle } from 'lucide-react';

export default function LatestSummary({ summary, decisions, risks, questions }) {
  if (!summary) return null;

  return (
    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
      <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <FileText size={18} /> Latest AI Insights
      </h3>
      
      <div style={{ background: 'var(--md-surface-dim)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
        <p style={{ color: 'var(--md-on-surface)', lineHeight: 1.6 }}>{summary}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        {decisions && decisions.length > 0 && (
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--md-success)' }}>
              ✅ Key Decisions
            </h4>
            <ul style={{ listStylePosition: 'inside', paddingLeft: 0, color: 'var(--md-on-surface-variant)', fontSize: 'var(--text-sm)' }}>
              {decisions.slice(0,3).map((d, i) => <li key={i} style={{ marginBottom: 4 }}>{d}</li>)}
            </ul>
          </div>
        )}

        {risks && risks.length > 0 && (
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--md-error)' }}>
              <AlertTriangle size={16} /> Risks Identified
            </h4>
            <ul style={{ listStylePosition: 'inside', paddingLeft: 0, color: 'var(--md-on-surface-variant)', fontSize: 'var(--text-sm)' }}>
              {risks.slice(0,3).map((r, i) => <li key={i} style={{ marginBottom: 4 }}>{r}</li>)}
            </ul>
          </div>
        )}
        
        {questions && questions.unanswered && questions.unanswered.length > 0 && (
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, color: '#E37400' }}>
              <HelpCircle size={16} /> Unanswered Questions
            </h4>
            <ul style={{ listStylePosition: 'inside', paddingLeft: 0, color: 'var(--md-on-surface-variant)', fontSize: 'var(--text-sm)' }}>
              {questions.unanswered.slice(0,3).map((q, i) => <li key={i} style={{ marginBottom: 4 }}>{q}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
