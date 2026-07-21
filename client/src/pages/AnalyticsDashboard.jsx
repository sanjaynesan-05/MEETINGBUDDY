import React, { useState, useMemo } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';

import AnalyticsLayout from '../components/analytics/AnalyticsLayout';
import LoadingSkeleton from '../components/analytics/LoadingSkeleton';
import EmptyState from '../components/analytics/EmptyState';
import ErrorState from '../components/analytics/ErrorState';

import OverviewCards from '../components/analytics/OverviewCards';
import MeetingsTrendChart from '../components/analytics/MeetingsTrendChart';
import SentimentChart from '../components/analytics/SentimentChart';
import EmotionChart from '../components/analytics/EmotionChart';
import MeetingTypeChart from '../components/analytics/MeetingTypeChart';
import EngagementChart from '../components/analytics/EngagementChart';
import ActionItemsChart from '../components/analytics/ActionItemsChart';
import KeywordCloud from '../components/analytics/KeywordCloud';
import TopParticipants from '../components/analytics/TopParticipants';

export default function AnalyticsDashboard() {
  const [dateFilter, setDateFilter] = useState('all');

  // Compute the exact ISO strings for from/to based on selection
  const filters = useMemo(() => {
    if (dateFilter === 'all') return {};
    
    const days = parseInt(dateFilter, 10);
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - days);
    
    return {
      from: fromDate.toISOString(),
      to: toDate.toISOString()
    };
  }, [dateFilter]);

  const { data, loading, error, refetch } = useAnalytics(filters);

  if (loading && !data) {
    return (
      <AnalyticsLayout dateFilter={dateFilter} setDateFilter={setDateFilter} onRefresh={refetch} isRefreshing={true}>
        <LoadingSkeleton />
      </AnalyticsLayout>
    );
  }

  if (error) {
    return (
      <AnalyticsLayout dateFilter={dateFilter} setDateFilter={setDateFilter} onRefresh={refetch} isRefreshing={false}>
        <ErrorState error={error} onRetry={refetch} />
      </AnalyticsLayout>
    );
  }

  // Handle empty database case gracefully
  if (!data || data.overview?.totalMeetings === 0) {
    return (
      <AnalyticsLayout dateFilter={dateFilter} setDateFilter={setDateFilter} onRefresh={refetch} isRefreshing={loading}>
        <EmptyState />
      </AnalyticsLayout>
    );
  }

  return (
    <AnalyticsLayout dateFilter={dateFilter} setDateFilter={setDateFilter} onRefresh={refetch} isRefreshing={loading}>
      <OverviewCards overview={data.overview} engagement={data.engagement} />
      
      <div className="analytics-grid-2">
        <MeetingsTrendChart trends={data.trends} />
        <EngagementChart engagement={data.engagement} />
      </div>

      <div className="analytics-grid-3">
        <SentimentChart sentiment={data.sentiment} />
        <EmotionChart emotion={data.emotion} />
        <MeetingTypeChart meetingTypes={data.meetingTypes} />
      </div>

      <div className="analytics-grid-3">
        <ActionItemsChart actionItems={data.actionItems} />
        <TopParticipants participants={data.participants} />
        <KeywordCloud keywords={data.keywords} />
      </div>
    </AnalyticsLayout>
  );
}
