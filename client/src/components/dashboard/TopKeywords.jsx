import { Tag } from 'lucide-react';

export default function TopKeywords({ keywords = [] }) {
  if (!keywords.length) return null;

  return (
    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
      <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Tag size={18} /> Top Keywords
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {keywords.map((keyword, i) => (
          <span key={i} style={{
            background: 'var(--md-primary-container)',
            color: 'var(--md-primary)',
            padding: '4px 12px',
            borderRadius: '16px',
            fontSize: 'var(--text-sm)',
            fontWeight: 500
          }}>
            {keyword}
          </span>
        ))}
      </div>
    </div>
  );
}
