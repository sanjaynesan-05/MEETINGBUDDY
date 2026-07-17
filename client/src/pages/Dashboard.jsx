import { useEffect, useState } from 'react';
import { dashboardAPI } from '../services/dashboardAPI';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import StatCard from '../components/dashboard/StatCard';
import RecentMeetings from '../components/dashboard/RecentMeetings';
import ActivityChart from '../components/dashboard/ActivityChart';
import MeetingTypeChart from '../components/dashboard/MeetingTypeChart';
import PendingActions from '../components/dashboard/PendingActions';
import TopKeywords from '../components/dashboard/TopKeywords';
import LatestSummary from '../components/dashboard/LatestSummary';
import QuickActions from '../components/dashboard/QuickActions';
import LoadingSkeleton from '../components/dashboard/LoadingSkeleton';
import EmptyState from '../components/dashboard/EmptyState';
import { FileAudio, CheckCircle, Clock, BarChart } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await dashboardAPI.getDashboardData();
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="page-content">
        <DashboardHeader />
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  // If there are no meetings at all
  if (data?.stats?.totalMeetings === 0) {
    return (
      <div className="page-content">
        <DashboardHeader />
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="page-content">
      <DashboardHeader />

      {/* Top Stats Grid */}
      <div className="stats-grid">
        <StatCard 
          title="Total Meetings" 
          value={data.stats.totalMeetings} 
          icon={<FileAudio size={24}/>} 
          colorClass="blue" 
        />
        <StatCard 
          title="Completed Meetings" 
          value={data.stats.completedMeetings} 
          icon={<CheckCircle size={24}/>} 
          colorClass="green" 
        />
        <StatCard 
          title="Processing" 
          value={data.stats.processingMeetings} 
          icon={<Clock size={24}/>} 
          colorClass="orange" 
        />
        <StatCard 
          title="Recording Hours" 
          value={data.stats.totalRecordingHours} 
          icon={<BarChart size={24}/>} 
          colorClass="red" 
          subtitle={`Avg ${data.stats.averageMeetingDuration} mins/meeting`}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
         <ActivityChart data={data.activity} />
         <MeetingTypeChart data={data.meetingTypes} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
           <LatestSummary 
             summary={data.latestSummary} 
             decisions={data.latestDecisions} 
             risks={data.latestRisks} 
             questions={data.questions} 
           />
           <RecentMeetings meetings={data.recentMeetings} onUpdate={fetchDashboardData} />
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
           <QuickActions />
           <PendingActions actions={data.pendingActions} />
           <TopKeywords keywords={data.topKeywords} />
        </div>
      </div>
    </div>
  );
}
