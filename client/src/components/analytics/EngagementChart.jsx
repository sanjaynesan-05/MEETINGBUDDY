import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ChartCard from './ChartCard';

const ENGAGEMENT_COLORS = {
  High: '#22c55e',   // Green
  Medium: '#eab308', // Yellow
  Low: '#ef4444'     // Red
};

export default function EngagementChart({ engagement }) {
  const chartData = useMemo(() => {
    if (!engagement) return [];
    return [
      { name: 'High', count: engagement.High || 0 },
      { name: 'Medium', count: engagement.Medium || 0 },
      { name: 'Low', count: engagement.Low || 0 }
    ].filter(item => item.count > 0);
  }, [engagement]);

  if (chartData.length === 0) {
    return (
      <ChartCard title="Engagement Levels">
        <div style={{ textAlign: 'center', color: 'var(--md-on-surface-variant)' }}>No engagement data available</div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Engagement Levels">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--md-outline-variant)" />
          <XAxis dataKey="name" tick={{ fill: 'var(--md-on-surface-variant)' }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: 'var(--md-on-surface-variant)' }} axisLine={false} tickLine={false} />
          <Tooltip 
            cursor={{ fill: 'rgba(0,0,0,0.05)' }} 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          {/* using cell to give specific colors */}
          <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Meetings">
            {
              chartData.map((entry, index) => (
                <cell key={`cell-${index}`} fill={ENGAGEMENT_COLORS[entry.name]} />
              ))
            }
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
