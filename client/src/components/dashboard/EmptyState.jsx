import { Link } from 'react-router-dom';
import { Upload } from 'lucide-react';

export default function EmptyState() {
  return (
    <div style={{
      textAlign: 'center',
      padding: 'var(--space-12) var(--space-4)',
      background: 'var(--md-surface)',
      borderRadius: 'var(--radius-lg)',
      border: '1px dashed var(--md-outline)',
      marginTop: 'var(--space-8)'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        background: 'var(--md-primary-container)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto var(--space-4)',
        color: 'var(--md-primary)'
      }}>
        <Upload size={32} />
      </div>
      <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
        No meetings yet
      </h2>
      <p style={{ color: 'var(--md-on-surface-variant)', marginBottom: 'var(--space-6)', maxWidth: 400, margin: '0 auto var(--space-6)' }}>
        Upload your first meeting recording to unlock AI transcription, insights, action items, and more.
      </p>
      <Link to="/meetings/upload" className="btn btn-primary">
        Upload Meeting
      </Link>
    </div>
  );
}
