import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Placeholder stats for Week 1
  const stats = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
        </svg>
      ),
      value: '0',
      label: 'Total Meetings',
      colorClass: 'blue',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      ),
      value: '0',
      label: 'Tasks Completed',
      colorClass: 'green',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      ),
      value: '0',
      label: 'Pending Tasks',
      colorClass: 'orange',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
        </svg>
      ),
      value: '—',
      label: 'Avg. Sentiment',
      colorClass: 'red',
    },
  ];

  // Placeholder recent meetings
  const recentMeetings = [
    {
      id: 1,
      title: 'No meetings yet',
      subtitle: 'Upload your first meeting recording to get started',
      time: '',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="page-content">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <h1>{getGreeting()}, {user?.name?.split(' ')[0] || 'User'} 👋</h1>
        <p>
          Welcome to Meeting Intelligence — your AI-powered meeting assistant.
          Upload a meeting recording to get transcripts, summaries, action items, and insights.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div className="stat-card" key={index}>
            <div className={`stat-icon ${stat.colorClass}`}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two column layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-6)',
      }}>
        {/* Recent Meetings */}
        <div className="activity-card">
          <div className="activity-header">
            <h2>Recent Meetings</h2>
            <button className="btn btn-text" id="dashboard-view-all-meetings">
              View all
            </button>
          </div>
          {recentMeetings.map((meeting) => (
            <div className="activity-item" key={meeting.id}>
              <div className="activity-icon">
                {meeting.icon}
              </div>
              <div className="activity-details">
                <h4>{meeting.title}</h4>
                <p>{meeting.subtitle}</p>
              </div>
              {meeting.time && (
                <span className="activity-time">{meeting.time}</span>
              )}
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="activity-card">
          <div className="activity-header">
            <h2>Quick Actions</h2>
          </div>
          <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <button className="btn btn-primary btn-full" id="dashboard-upload-meeting" style={{ justifyContent: 'flex-start', gap: '12px', paddingLeft: '20px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
              </svg>
              Upload Meeting Recording
            </button>
            <button className="btn btn-secondary btn-full" id="dashboard-search-meetings" style={{ justifyContent: 'flex-start', gap: '12px', paddingLeft: '20px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              Search Past Meetings
            </button>
            <button className="btn btn-secondary btn-full" id="dashboard-view-tasks" style={{ justifyContent: 'flex-start', gap: '12px', paddingLeft: '20px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              View Action Items
            </button>
            <button className="btn btn-secondary btn-full" id="dashboard-analytics" style={{ justifyContent: 'flex-start', gap: '12px', paddingLeft: '20px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
              </svg>
              View Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Getting Started Section */}
      <div style={{
        marginTop: 'var(--space-8)',
        background: 'var(--md-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--md-outline-variant)',
        padding: 'var(--space-8)',
      }}>
        <h2 style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 500,
          color: 'var(--md-on-surface)',
          marginBottom: 'var(--space-6)',
        }}>
          Getting Started
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-6)',
        }}>
          {[
            {
              step: '1',
              title: 'Upload a Meeting',
              desc: 'Upload an audio or video recording of your meeting.',
              color: '#1A73E8',
            },
            {
              step: '2',
              title: 'AI Transcription',
              desc: 'Get an automatic transcript with speaker labels.',
              color: '#34A853',
            },
            {
              step: '3',
              title: 'Smart Summary',
              desc: 'Review AI-generated summaries and action items.',
              color: '#FBBC04',
            },
            {
              step: '4',
              title: 'Search & Insights',
              desc: 'Ask questions about your meetings using AI.',
              color: '#EA4335',
            },
          ].map((item) => (
            <div key={item.step} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 'var(--space-3)',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: item.color,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--text-xl)',
                fontWeight: 600,
              }}>
                {item.step}
              </div>
              <h3 style={{
                fontSize: 'var(--text-md)',
                fontWeight: 500,
                color: 'var(--md-on-surface)',
              }}>
                {item.title}
              </h3>
              <p style={{
                fontSize: 'var(--text-base)',
                color: 'var(--md-on-surface-variant)',
                lineHeight: 1.5,
              }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
