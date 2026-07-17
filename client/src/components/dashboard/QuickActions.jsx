import { Link } from 'react-router-dom';
import { Upload, List, Search, BarChart2, Settings, MessageSquare } from 'lucide-react';

export default function QuickActions() {
  const actions = [
    { name: 'Upload', icon: <Upload size={20} />, path: '/meetings/upload', color: 'blue' },
    { name: 'Meetings', icon: <List size={20} />, path: '/meetings', color: 'green' },
    { name: 'Search', icon: <Search size={20} />, path: '/search', color: 'orange' },
    { name: 'Analytics', icon: <BarChart2 size={20} />, path: '/analytics', color: 'blue' },
    { name: 'AI Chat', icon: <MessageSquare size={20} />, path: '/chat', color: 'green' },
    { name: 'Settings', icon: <Settings size={20} />, path: '/settings', color: 'orange' }
  ];

  return (
    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
      <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Quick Actions</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 'var(--space-4)' }}>
        {actions.map((action, i) => (
          <Link 
            key={i} 
            to={action.path} 
            className="card-interactive"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: 'var(--space-2)',
              padding: 'var(--space-4) var(--space-2)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--md-outline-variant)',
              background: 'var(--md-surface)'
            }}
          >
            <div className={`stat-icon ${action.color}`} style={{ width: 40, height: 40, borderRadius: '50%' }}>
              {action.icon}
            </div>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--md-on-surface)' }}>{action.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
