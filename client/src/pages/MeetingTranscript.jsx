import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { meetingAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AIInsights from "../components/meeting/AIInsights";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(seconds) {
  if (!seconds) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export default function MeetingTranscript() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pollRef = useRef(null);

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch meeting data
  const fetchMeeting = useCallback(async () => {
    try {
      const res = await meetingAPI.getById(id);
      setMeeting(res.data.meeting);
      setError('');
      return res.data.meeting;
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to load meeting.';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const m = await fetchMeeting();
      if (m && (m.status === 'completed' || m.status === 'failed')) {
        stopPolling();
      }
    }, 3000);
  }, [fetchMeeting, stopPolling]);

  // Initial fetch + polling for transcription status
  useEffect(() => {
    fetchMeeting().then((m) => {
      if (m && (m.status === 'transcribing' || m.status === 'uploaded')) {
        startPolling();
      }
    });

    return () => stopPolling();
  }, [fetchMeeting, startPolling, stopPolling]);

  // Copy transcript to clipboard
  const handleCopy = async () => {
    if (!meeting?.transcript) return;
    try {
      await navigator.clipboard.writeText(meeting.transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = meeting.transcript;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Download transcript as .txt
  const handleDownload = () => {
    if (!meeting?.transcript) return;
    const blob = new Blob([meeting.transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title.replace(/[^a-z0-9]/gi, '_')}_transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Delete meeting
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await meetingAPI.delete(id);
      navigate('/meetings', { replace: true });
    } catch {
      setError('Failed to delete meeting.');
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Highlight search matches in transcript
  const renderTranscript = () => {
    if (!meeting?.transcript) return null;

    if (!searchQuery.trim()) {
      return meeting.transcript;
    }

    const parts = meeting.transcript.split(
      new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    );

    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} className="search-highlight">{part}</mark>
      ) : (
        part
      )
    );
  };

  // Count search matches
  const matchCount = searchQuery.trim() && meeting?.transcript
    ? (meeting.transcript.match(
        new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
      ) || []).length
    : 0;

  if (loading) return <LoadingSpinner fullPage />;

  if (error && !meeting) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="var(--md-error)">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </div>
          <h2>Meeting Not Found</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/meetings')}>
            Back to Meetings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <AIInsights meetingId={id} />
      {/* Breadcrumb */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link to="/meetings" style={{ fontSize: 'var(--text-base)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          Back to Meetings
        </Link>
      </div>

      {/* Meeting Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{
            fontSize: 'var(--text-3xl)',
            fontWeight: 600,
            color: 'var(--md-on-surface)',
            marginBottom: 'var(--space-2)',
          }}>
            {meeting.title}
          </h1>
          {meeting.description && (
            <p style={{ fontSize: 'var(--text-md)', color: 'var(--md-on-surface-variant)', marginBottom: 'var(--space-3)' }}>
              {meeting.description}
            </p>
          )}
        </div>
        <span className={`status-badge ${meeting.status}`}>
          {meeting.status === 'transcribing' && (
            <span className="spinner spinner-sm" style={{ width: '14px', height: '14px', borderWidth: '2px', borderTopColor: 'currentColor', borderColor: 'rgba(0,0,0,0.15)' }} />
          )}
          {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
        </span>
      </div>

      {/* Metadata Row */}
      <div className="meta-row">
        <span className="meta-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
          </svg>
          {formatDate(meeting.createdAt)}
        </span>
        <span className="meta-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
          {meeting.fileType === 'audio' ? 'Audio' : 'Video'} • {meeting.formattedFileSize}
        </span>
        {meeting.duration > 0 && (
          <span className="meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
            </svg>
            {formatDuration(meeting.duration)}
          </span>
        )}
        {meeting.wordCount > 0 && (
          <span className="meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.5 4v3h5v12h3V7h5V4h-13zm19 5h-9v3h3v7h3v-7h3V9z" />
            </svg>
            {meeting.wordCount.toLocaleString()} words
          </span>
        )}
        {meeting.language && (
          <span className="meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z" />
            </svg>
            {meeting.language.toUpperCase()}
          </span>
        )}
      </div>

      {/* Error from transcription */}
      {meeting.transcriptionError && meeting.status === 'failed' && (
        <div className="alert alert-error" style={{ marginBottom: 'var(--space-6)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <div>
            <strong>Transcription failed:</strong> {meeting.transcriptionError}
          </div>
        </div>
      )}

      {/* Transcribing State — Skeleton */}
      {(meeting.status === 'transcribing' || meeting.status === 'uploaded') && (
        <div className="card" style={{ padding: 'var(--space-8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
            <span className="spinner spinner-sm" />
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 500, color: 'var(--md-on-surface)' }}>
              Transcribing your meeting...
            </h2>
          </div>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--md-on-surface-variant)', marginBottom: 'var(--space-6)' }}>
            This may take a few minutes depending on the file size. The page will update automatically.
          </p>
          
          {(meeting.transcriptionProgress > 0) && (
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--md-on-surface-variant)' }}>Processing audio...</span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--md-primary)' }}>{Math.round(meeting.transcriptionProgress)}%</span>
              </div>
              <div className="progress-container" style={{ background: 'var(--md-surface-variant)', borderRadius: 'var(--radius-full)', height: '8px', overflow: 'hidden' }}>
                <div className="progress-bar" style={{ 
                  width: `${meeting.transcriptionProgress}%`, 
                  background: 'var(--md-primary)', 
                  height: '100%', 
                  transition: 'width 0.3s ease' 
                }} />
              </div>
            </div>
          )}

          <div className="skeleton-line" />
          <div className="skeleton-line" />
          <div className="skeleton-line" />
          <div className="skeleton-line" />
          <div className="skeleton-line" />
        </div>
      )}

      {/* Completed Transcript */}
      {meeting.status === 'completed' && meeting.transcript && (
        <>
          {/* Toolbar */}
          <div className="transcript-toolbar">
            <div className="search-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search transcript..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="transcript-search"
              />
            </div>
            {searchQuery.trim() && (
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--md-on-surface-variant)', whiteSpace: 'nowrap' }}>
                {matchCount} match{matchCount !== 1 ? 'es' : ''}
              </span>
            )}
            <button className="btn btn-secondary" onClick={handleCopy} id="transcript-copy">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
              </svg>
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button className="btn btn-secondary" onClick={handleDownload} id="transcript-download">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
              </svg>
              Download
            </button>
          </div>

          {/* Transcript Text */}
          <div className="transcript-container" id="transcript-content">
            {renderTranscript()}
          </div>
        </>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
        <button
          className="btn btn-danger"
          onClick={() => setShowDeleteDialog(true)}
          id="meeting-delete"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
          </svg>
          Delete Meeting
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="dialog-overlay" onClick={() => setShowDeleteDialog(false)}>
          <div className="dialog-card" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Meeting?</h3>
            <p>
              This will permanently delete <strong>{meeting.title}</strong> and its transcript.
              This action cannot be undone.
            </p>
            <div className="dialog-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <span className="spinner spinner-sm" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
