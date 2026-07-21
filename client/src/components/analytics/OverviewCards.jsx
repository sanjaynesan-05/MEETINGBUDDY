import React from 'react';
import { FileAudio, Clock, Target, Activity } from 'lucide-react';

export default function OverviewCards({ overview, engagement }) {
  
  const formatDuration = (seconds) => {
    if (!seconds) return '0h 0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const statStyle = {
    background: 'var(--md-surface)',
    border: '1px solid var(--md-outline-variant)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-4)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)'
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    color: 'var(--md-on-surface-variant)',
    fontSize: 'var(--text-sm)',
    fontWeight: 500
  };

  const valueStyle = {
    fontSize: 'var(--text-2xl)',
    fontWeight: 700,
    color: 'var(--md-on-surface)'
  };

  return (
    <div className="analytics-grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
      <div style={statStyle}>
        <div style={headerStyle}>
          <FileAudio size={18} style={{ color: 'var(--md-primary)' }} />
          <span>Total Meetings</span>
        </div>
        <div style={valueStyle}>{overview?.totalMeetings || 0}</div>
      </div>

      <div style={statStyle}>
        <div style={headerStyle}>
          <Clock size={18} style={{ color: 'var(--md-primary)' }} />
          <span>Total Duration</span>
        </div>
        <div style={valueStyle}>{formatDuration(overview?.totalDuration)}</div>
      </div>

      <div style={statStyle}>
        <div style={headerStyle}>
          <Target size={18} style={{ color: '#8b5cf6' }} />
          <span>Avg Confidence</span>
        </div>
        <div style={valueStyle}>{overview?.averageConfidence || 0}%</div>
      </div>

      <div style={statStyle}>
        <div style={headerStyle}>
          <Activity size={18} style={{ color: '#0ea5e9' }} />
          <span>Avg Engagement</span>
        </div>
        <div style={valueStyle}>{engagement?.averageScore || 0}/100</div>
      </div>
    </div>
  );
}
