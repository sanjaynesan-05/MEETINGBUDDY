import React, { useMemo } from 'react';
import ChartCard from './ChartCard';

export default function TopParticipants({ participants }) {
  const topList = useMemo(() => {
    if (!participants || participants.length === 0) return [];
    return participants.slice(0, 5); // Just top 5
  }, [participants]);

  if (topList.length === 0) {
    return (
      <ChartCard title="Most Active Participants">
        <div style={{ textAlign: 'center', color: 'var(--md-on-surface-variant)' }}>No participants found</div>
      </ChartCard>
    );
  }

  const maxCount = Math.max(...topList.map(p => p.count));

  return (
    <ChartCard title="Most Active Participants">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {topList.map((participant, index) => (
          <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', color: 'var(--md-on-surface)' }}>
              <span style={{ fontWeight: 500 }}>{participant.name}</span>
              <span style={{ color: 'var(--md-on-surface-variant)' }}>{participant.count} {participant.count === 1 ? 'meeting' : 'meetings'}</span>
            </div>
            <div style={{ width: '100%', backgroundColor: 'var(--md-surface-variant)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  backgroundColor: 'var(--md-primary)', 
                  width: `${(participant.count / maxCount) * 100}%`,
                  borderRadius: '4px'
                }} 
              />
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
