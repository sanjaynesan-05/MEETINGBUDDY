import { Link } from 'react-router-dom';
import { Upload, Bell, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function DashboardHeader() {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 'var(--space-8)',
      flexWrap: 'wrap',
      gap: 'var(--space-4)'
    }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: '600', marginBottom: 'var(--space-1)' }}>
          Welcome back, {user?.name?.split(' ')[0] || 'User'}
        </h1>
        <p style={{ color: 'var(--md-on-surface-variant)' }}>{today}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--md-on-surface-variant)' }} />
          <input 
            type="text" 
            placeholder="Search meetings..." 
            className="form-input" 
            style={{ width: '250px', paddingLeft: '40px', height: '40px' }} 
          />
        </div>
        
        <button className="btn btn-secondary" style={{ padding: '0 10px', height: '40px' }}>
          <Bell size={20} />
        </button>

        <Link to="/meetings/upload" className="btn btn-primary" style={{ height: '40px' }}>
          <Upload size={18} />
          <span>Upload</span>
        </Link>
      </div>
    </div>
  );
}
