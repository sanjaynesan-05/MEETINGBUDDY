import { Link } from 'react-router-dom';
import { FileAudio, FileVideo, ExternalLink, Trash2 } from 'lucide-react';
import { meetingAPI } from '../../services/meetingAPI';

export default function RecentMeetings({ meetings = [], onUpdate }) {
  
  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed': return <span style={{ color: 'var(--md-success)', background: 'var(--md-success-light)', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>Completed</span>;
      case 'transcribing': return <span style={{ color: '#E37400', background: 'var(--md-warning-light)', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>Processing</span>;
      case 'failed': return <span style={{ color: 'var(--md-error)', background: 'var(--md-error-light)', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>Failed</span>;
      default: return <span style={{ color: 'var(--md-secondary)', background: 'var(--md-surface-variant)', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>{status}</span>;
    }
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    if(window.confirm('Delete this meeting?')) {
      try {
        await meetingAPI.delete(id);
        if (onUpdate) onUpdate();
      } catch(err) {
        alert('Failed to delete');
      }
    }
  };

  if (!meetings.length) return null;

  return (
    <div className="activity-card" style={{ marginBottom: 'var(--space-6)' }}>
      <div className="activity-header">
        <h2>Recent Meetings</h2>
        <Link to="/meetings" style={{ fontSize: 'var(--text-sm)' }}>View all</Link>
      </div>
      <div>
        {meetings.map((meeting) => (
          <Link key={meeting._id} to={`/meetings/${meeting._id}`} className="activity-item" style={{ textDecoration: 'none' }}>
            <div className="activity-icon" style={{ background: 'var(--md-surface-variant)', color: 'var(--md-secondary)' }}>
              {meeting.title.toLowerCase().includes('video') ? <FileVideo size={20}/> : <FileAudio size={20}/>}
            </div>
            
            <div className="activity-details">
              <h4>{meeting.title}</h4>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                <span className="activity-time">
                  {new Date(meeting.createdAt).toLocaleDateString()}
                </span>
                {getStatusBadge(meeting.status)}
                {meeting.aiStatus === 'completed' && (
                   <span style={{ color: '#4338CA', background: '#EEF2FF', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>AI Insight Ready</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={(e) => handleDelete(e, meeting._id)}
                className="btn btn-text" 
                style={{ padding: 4, color: 'var(--md-error)' }}
              >
                <Trash2 size={16} />
              </button>
              <div className="btn btn-secondary" style={{ padding: '4px 8px', height: 'auto' }}>
                Open <ExternalLink size={14} style={{ marginLeft: 4 }} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
