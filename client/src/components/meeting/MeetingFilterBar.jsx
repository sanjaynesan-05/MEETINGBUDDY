import React from 'react';

export default function MeetingFilterBar({ activeFilter, setActiveFilter }) {
    const filters = [
        { label: "All Insights", value: "All" },
        { label: "Action Items", value: "Action Item" },
        { label: "Decisions", value: "Decision" },
        { label: "Risks", value: "Risk" },
        { label: "People / Speakers", value: "Person" },
        { label: "Technologies", value: "Technology" }
    ];
    
    return (
        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {filters.map(f => (
                <button 
                    key={f.value}
                    onClick={() => setActiveFilter(f.value)}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '24px',
                        border: activeFilter === f.value ? 'none' : '1px solid #e5e7eb',
                        background: activeFilter === f.value ? 'var(--md-primary)' : '#fff',
                        color: activeFilter === f.value ? '#fff' : '#4b5563',
                        cursor: 'pointer',
                        fontWeight: activeFilter === f.value ? 600 : 500,
                        fontSize: '14px',
                        transition: 'all 0.2s ease'
                    }}
                >
                    {f.label}
                </button>
            ))}
        </div>
    );
}
