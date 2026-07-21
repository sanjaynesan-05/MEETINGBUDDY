import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState() {
  return (
    <div className="analytics-empty">
      <BarChart3 size={64} style={{ color: 'var(--md-primary)', opacity: 0.5 }} />
      <h2>No analytics available yet</h2>
      <p>Process your first meeting to generate organization insights.</p>
      <Link to="/meetings/upload" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
        Upload a Meeting
      </Link>
    </div>
  );
}
