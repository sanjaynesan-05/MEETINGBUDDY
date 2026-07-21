import { AlertTriangle, ShieldCheck } from "lucide-react";

export default function RisksCard({ risks }) {
  return (
    <div className="card" style={{ marginBottom: "var(--space-6)", borderColor: risks?.length > 0 ? "#fca5a5" : "var(--md-outline-variant)", background: risks?.length > 0 ? "#fef2f2" : "var(--md-surface)" }}>
      <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, marginBottom: "var(--space-4)", display: 'flex', alignItems: 'center', gap: '8px', color: risks?.length > 0 ? '#991b1b' : 'var(--md-on-surface)' }}>
        <AlertTriangle size={20} color={risks?.length > 0 ? "#dc2626" : "var(--md-on-surface-variant)"} />
        Risks & Blockers
      </h3>
      
      {!risks || risks.length === 0 ? (
        <div className="empty-state" style={{ background: 'var(--md-success-light)', color: 'var(--md-success)' }}>
          <ShieldCheck size={18} />
          <span>✅ No critical risks detected.</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {risks.map((risk, i) => (
            <div key={i} className="risk-item" style={{ borderBottomColor: '#fecaca' }}>
              <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: 'var(--text-base)', color: '#7f1d1d' }}>{risk}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
