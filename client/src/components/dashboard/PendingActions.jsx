import { Link } from 'react-router-dom';
import { CheckCircle, Clock } from 'lucide-react';

export default function PendingActions({ actions = [] }) {
  if (!actions.length) return null;

  return (
    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Pending Actions</h3>
        <span style={{ background: 'var(--md-error-light)', color: 'var(--md-error)', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
          {actions.length} Pending
        </span>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {actions.map((action, i) => (
          <div key={i} style={{ 
            padding: 'var(--space-3)', 
            border: '1px solid var(--md-outline-variant)', 
            borderRadius: 'var(--radius-md)',
            background: 'var(--md-surface-dim)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
              <div style={{ color: 'var(--md-secondary)', marginTop: 2 }}>
                <CheckCircle size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 500, fontSize: 'var(--text-base)', marginBottom: 4 }}>{action.task}</p>
                <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--md-on-surface-variant)', flexWrap: 'wrap' }}>
                  <span>👤 {action.owner || 'Unassigned'}</span>
                  <span>⭐ {action.priority}</span>
                  {action.deadline && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={14} /> {action.deadline}
                    </span>
                  )}
                  <span>🔗 <Link to={`/meetings/${action.meetingId}`} style={{ color: 'var(--md-primary)' }}>{action.meetingTitle}</Link></span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
