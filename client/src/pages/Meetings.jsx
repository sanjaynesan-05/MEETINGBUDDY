import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { meetingAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function formatDate(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export default function Meetings() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await meetingAPI.getAll();
        setMeetings(res.data.meetings);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load meetings.');
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="page-content">
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-8)',
        flexWrap: 'wrap',
        gap: 'var(--space-4)',
      }}>
        <div>
          <h1 style={{
            fontSize: 'var(--text-3xl)',
            fontWeight: 600,
            color: 'var(--md-on-surface)',
            marginBottom: 'var(--space-1)',
          }}>
            Meetings
          </h1>
          <p style={{ fontSize: 'var(--text-md)', color: 'var(--md-on-surface-variant)' }}>
            {meetings.length} meeting{meetings.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/meetings/upload')}
          id="meetings-upload-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
          </svg>
          Upload Meeting
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 'var(--space-6)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {meetings.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="var(--md-primary)">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <h2>No meetings yet</h2>
          <p>Upload your first meeting recording to generate an AI-powered transcript.</p>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate('/meetings/upload')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
            </svg>
            Upload Meeting
          </button>
        </div>
      )}

      {/* Meeting Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {meetings.map((meeting) => (
          <Link
            to={`/meetings/${meeting._id}`}
            key={meeting._id}
            className="meeting-card"
            id={`meeting-${meeting._id}`}
          >
            {/* File type icon */}
            <div
              className="meeting-card-icon"
              style={{
                background: meeting.fileType === 'audio'
                  ? 'var(--md-primary-container)'
                  : 'var(--md-error-light)',
                color: meeting.fileType === 'audio'
                  ? 'var(--md-primary)'
                  : 'var(--md-error)',
              }}
            >
              {meeting.fileType === 'audio' ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                </svg>
              )}
            </div>

            {/* Meeting details */}
            <div className="meeting-card-body">
              <h3>{meeting.title}</h3>
              <div className="meeting-card-meta">
                <span>{formatDate(meeting.createdAt)}</span>
                {meeting.wordCount > 0 && (
                  <span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.5 4v3h5v12h3V7h5V4h-13zm19 5h-9v3h3v7h3v-7h3V9z" />
                    </svg>
                    {meeting.wordCount.toLocaleString()} words
                  </span>
                )}
                <span>{meeting.formattedFileSize}</span>
              </div>
            </div>

            {/* Status badge */}
            <span className={`status-badge ${meeting.status}`}>
              {meeting.status === 'transcribing' && (
                <span className="spinner spinner-sm" style={{ width: '12px', height: '12px', borderWidth: '2px', borderTopColor: 'currentColor', borderColor: 'rgba(0,0,0,0.15)' }} />
              )}
              {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
