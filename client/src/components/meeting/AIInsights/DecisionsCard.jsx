import { CheckSquare, Info } from "lucide-react";

export default function DecisionsCard({ decisions }) {
  return (
    <div className="card" style={{ marginBottom: "var(--space-6)" }}>
      <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, marginBottom: "var(--space-4)", display: 'flex', alignItems: 'center', gap: '8px' }}>
        <CheckSquare size={20} color="var(--md-primary)" />
        Decisions
      </h3>
      
      {!decisions || decisions.length === 0 ? (
        <div className="empty-state">
          <Info size={18} />
          No decisions were recorded in this meeting.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {decisions.map((decision, i) => (
            <div key={i} className="decision-item">
              <CheckSquare size={18} color="var(--md-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: 'var(--text-base)', color: 'var(--md-on-surface)' }}>{decision}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
