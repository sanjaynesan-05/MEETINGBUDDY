import React from 'react';

export default function ChartCard({ title, children, action }) {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3 className="chart-card-title">{title}</h3>
        {action && <div className="chart-card-action">{action}</div>}
      </div>
      <div className="chart-card-content">
        {children}
      </div>
    </div>
  );
}
