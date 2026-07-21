import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ChartCard from './ChartCard';

export default function EmotionChart({ emotion }) {
  const chartData = useMemo(() => {
    if (!emotion) return [];
    // Convert object to array and sort by value descending
    return Object.keys(emotion)
      .map(key => ({ name: key, value: emotion[key] }))
      .sort((a, b) => b.value - a.value);
  }, [emotion]);

  if (chartData.length === 0) {
    return (
      <ChartCard title="Primary Emotions">
        <div style={{ textAlign: 'center', color: 'var(--md-on-surface-variant)' }}>No emotion data available</div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Primary Emotions">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--md-outline-variant)" />
          <XAxis type="number" allowDecimals={false} hide />
          <YAxis type="category" dataKey="name" tick={{ fill: 'var(--md-on-surface-variant)' }} axisLine={false} tickLine={false} width={100} />
          <Tooltip 
            cursor={{ fill: 'rgba(0,0,0,0.05)' }} 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Count" barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
