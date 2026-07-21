import React, { useMemo } from 'react';
import ChartCard from './ChartCard';

export default function KeywordCloud({ keywords }) {
  const cloudData = useMemo(() => {
    if (!keywords || keywords.length === 0) return [];
    // Calculate relative sizes
    const maxCount = Math.max(...keywords.map(k => k.count));
    const minCount = Math.min(...keywords.map(k => k.count));
    
    return keywords.map(k => {
      // Size between 1rem and 2rem
      const size = minCount === maxCount ? 1.2 : 1 + ((k.count - minCount) / (maxCount - minCount));
      return { ...k, size };
    });
  }, [keywords]);

  if (cloudData.length === 0) {
    return (
      <ChartCard title="Top Keywords">
        <div style={{ textAlign: 'center', color: 'var(--md-on-surface-variant)' }}>No keywords available</div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Top Keywords">
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '12px', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 'var(--space-4)'
      }}>
        {cloudData.map((item, index) => (
          <span 
            key={index}
            style={{
              fontSize: `${item.size}rem`,
              color: `hsl(210, ${60 + (item.size - 1) * 40}%, ${50 - (item.size - 1) * 15}%)`,
              fontWeight: item.size > 1.5 ? 600 : 400,
              padding: '4px 8px',
              backgroundColor: 'var(--md-surface-variant)',
              borderRadius: '16px',
              transition: 'transform 0.2s'
            }}
            title={`Count: ${item.count}`}
          >
            {item.keyword}
          </span>
        ))}
      </div>
    </ChartCard>
  );
}
