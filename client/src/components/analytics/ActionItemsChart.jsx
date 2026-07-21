import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ChartCard from './ChartCard';

const STATUS_COLORS = {
  Completed: '#22c55e', // Green
  Pending: '#ef4444'    // Red
};

export default function ActionItemsChart({ actionItems }) {
  const chartData = useMemo(() => {
    if (!actionItems) return [];
    return [
      { name: 'Completed', value: actionItems.completed || 0 },
      { name: 'Pending', value: actionItems.pending || 0 }
    ].filter(item => item.value > 0);
  }, [actionItems]);

  if (chartData.length === 0) {
    return (
      <ChartCard title="Action Items">
        <div style={{ textAlign: 'center', color: 'var(--md-on-surface-variant)' }}>No action items available</div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Action Items">
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
              <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
