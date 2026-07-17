export default function LoadingSkeleton() {
  return (
    <div className="page-content" style={{ animation: "pulse 1.5s infinite" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <div style={{ height: 32, width: 250, background: 'var(--md-surface-variant)', borderRadius: 8, marginBottom: 8 }}></div>
          <div style={{ height: 16, width: 150, background: 'var(--md-surface-variant)', borderRadius: 4 }}></div>
        </div>
        <div style={{ height: 40, width: 120, background: 'var(--md-surface-variant)', borderRadius: 20 }}></div>
      </div>
      
      <div className="stats-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card" style={{ height: 100, background: 'var(--md-surface-variant)', border: 'none' }}></div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '24px' }}>
        <div className="card" style={{ height: 300, background: 'var(--md-surface-variant)', border: 'none' }}></div>
        <div className="card" style={{ height: 300, background: 'var(--md-surface-variant)', border: 'none' }}></div>
      </div>
    </div>
  );
}
