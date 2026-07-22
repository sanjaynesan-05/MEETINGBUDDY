import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      </svg>
    ),
  },
  {
    path: '/meetings',
    label: 'Meetings',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
      </svg>
    ),
  },
  {
    path: '/tasks',
    label: 'Tasks',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    ),
  },
  {
    path: '/analytics',
    label: 'Analytics',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
      </svg>
    ),
  },
  {
    path: '/search',
    label: 'Search',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
      </svg>
    ),
  },
  {
    path: '/chat',
    label: 'AI Chat',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
      </svg>
    ),
  },
];

const bottomItems = [
  {
    path: '/settings',
    label: 'Settings',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
      </svg>
    ),
  },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();

  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`} style={styles.sidebar}>
      <nav style={styles.nav}>
        <div style={styles.navMain}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={{
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '12px' : '0 12px 0 16px',
                }}
                id={`sidebar-${item.label.toLowerCase()}`}
              >
                <span style={{
                  ...styles.navIcon,
                  color: isActive ? 'var(--md-primary)' : 'var(--md-on-surface-variant)',
                }}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span style={{
                    ...styles.navLabel,
                    color: isActive ? 'var(--md-primary)' : 'var(--md-on-surface)',
                    fontWeight: isActive ? 600 : 400,
                  }}>
                    {item.label}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        <div style={styles.navBottom}>
          <div style={styles.navDivider} />
          {bottomItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={{
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '12px' : '0 12px 0 16px',
                }}
                id={`sidebar-${item.label.toLowerCase()}`}
              >
                <span style={{
                  ...styles.navIcon,
                  color: isActive ? 'var(--md-primary)' : 'var(--md-on-surface-variant)',
                }}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span style={{
                    ...styles.navLabel,
                    color: isActive ? 'var(--md-primary)' : 'var(--md-on-surface)',
                    fontWeight: isActive ? 600 : 400,
                  }}>
                    {item.label}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}

const styles = {
  sidebar: {
    position: 'fixed',
    top: 'var(--topbar-height)',
    left: 0,
    bottom: 0,
    background: 'var(--md-surface)',
    borderRight: '1px solid var(--md-outline-variant)',
    transition: 'width var(--transition-slow)',
    zIndex: 999,
    overflowX: 'hidden',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '8px',
  },
  navMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
  },
  navBottom: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  navDivider: {
    height: '1px',
    background: 'var(--md-outline-variant)',
    margin: '8px 12px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    height: '48px',
    borderRadius: 'var(--radius-2xl)',
    textDecoration: 'none',
    transition: 'all var(--transition-fast)',
    cursor: 'pointer',
  },
  navItemActive: {
    background: 'var(--md-primary-container)',
  },
  navIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    flexShrink: 0,
  },
  navLabel: {
    fontSize: 'var(--text-base)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    letterSpacing: '0.01em',
  },
};
