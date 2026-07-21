import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ChartCard from './ChartCard';

const SENTIMENT_COLORS = {
  Positive: '#22c55e', // Green
  Neutral: '#eab308',  // Yellow
  Negative: '#ef4444'  // Red
};

export default function SentimentChart({ sentiment }) {
  const chartData = useMemo(() => {
    if (!sentiment) return [];
    return Object.keys(sentiment).map(key => ({
      name: key,
      value: sentiment[key]
    })).filter(item => item.value > 0);
  }, [sentiment]);

  if (chartData.length === 0) {
    return (
      <ChartCard title="Overall Sentiment">
        <div style={{ textAlign: 'center', color: 'var(--md-on-surface-variant)' }}>No sentiment data available</div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Overall Sentiment">
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
              <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.name] || 'var(--md-primary)'} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
