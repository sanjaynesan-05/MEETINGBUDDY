import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ChartCard from './ChartCard';

const TYPE_COLORS = ['#3b82f6', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

export default function MeetingTypeChart({ meetingTypes }) {
  const chartData = useMemo(() => {
    if (!meetingTypes) return [];
    return Object.keys(meetingTypes).map(key => ({
      name: key,
      value: meetingTypes[key]
    })).filter(item => item.value > 0);
  }, [meetingTypes]);

  if (chartData.length === 0) {
    return (
      <ChartCard title="Meeting Types">
        <div style={{ textAlign: 'center', color: 'var(--md-on-surface-variant)' }}>No meeting type data available</div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Meeting Types">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
