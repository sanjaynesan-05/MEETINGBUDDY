import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ChartCard from './ChartCard';

export default function MeetingsTrendChart({ trends }) {
  const chartData = useMemo(() => {
    if (!trends || trends.length === 0) return [];
    return trends;
  }, [trends]);

  if (chartData.length === 0) {
    return (
      <ChartCard title="Meetings Trend">
        <div style={{ textAlign: 'center', color: 'var(--md-on-surface-variant)' }}>Not enough data</div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Meetings Trend">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--md-outline-variant)" />
          <XAxis dataKey="date" tick={{ fill: 'var(--md-on-surface-variant)' }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: 'var(--md-on-surface-variant)' }} axisLine={false} tickLine={false} />
          <Tooltip 
            cursor={{ fill: 'rgba(0,0,0,0.05)' }} 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="count" fill="var(--md-primary)" radius={[4, 4, 0, 0]} name="Meetings" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
