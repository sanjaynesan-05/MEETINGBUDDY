import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';

const CitationCard = ({ citation }) => {
  const meetingUrl = citation.meetingId
    ? `/meetings/${citation.meetingId}`
    : null;

  return (
    <a
      href={meetingUrl || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="citation-card"
      onClick={(e) => {
        if (!meetingUrl) e.preventDefault();
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--md-on-surface-variant)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileText size={14} />
          <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }} title={citation.meetingTitle || citation.meetingId}>
            {citation.meetingTitle || citation.meetingId}
          </span>
        </div>
        {citation.sourceLabel && (
          <span style={{ color: 'var(--md-primary)', fontWeight: 600 }}>
            {citation.sourceLabel}
          </span>
        )}
        <ExternalLink size={12} />
      </div>

      {citation.snippet && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--md-on-surface-variant)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {citation.snippet.slice(0, 200)}...
        </p>
      )}
    </a>
  );
};

export default CitationCard;
