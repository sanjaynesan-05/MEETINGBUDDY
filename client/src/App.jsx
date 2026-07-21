import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Meetings from './pages/Meetings';
import MeetingUpload from './pages/MeetingUpload';
import MeetingTranscript from './pages/MeetingTranscript';
import AIChatPage from './pages/AIChatPage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';

// Layout for authenticated pages (with Navbar + Sidebar)
function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="app-layout">
      <Navbar onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main
        className={`app-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
      >
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/meetings/upload" element={<MeetingUpload />} />
          <Route path="/meetings/:id" element={<MeetingTranscript />} />
          <Route path="/chat" element={<AIChatPage />} />
          {/* Future routes for Week 3+ */}
          <Route path="/tasks" element={<ComingSoon title="Tasks" />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/search" element={<ComingSoon title="Search" />} />
          <Route path="/settings" element={<ComingSoon title="Settings" />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

// Placeholder page for future features
function ComingSoon({ title }) {
  return (
    <div className="page-content">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'var(--md-primary-container)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--space-6)',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="var(--md-primary)">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
        </div>
        <h1 style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: 500,
          color: 'var(--md-on-surface)',
          marginBottom: 'var(--space-2)',
        }}>
          {title}
        </h1>
        <p style={{
          fontSize: 'var(--text-md)',
          color: 'var(--md-on-surface-variant)',
          maxWidth: '400px',
        }}>
          This feature is coming soon. Check back in the next update!
        </p>
      </div>
    </div>
  );
}

// Root component with auth-aware routing
function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
