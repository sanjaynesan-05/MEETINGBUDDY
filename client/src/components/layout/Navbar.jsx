import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiClient.get('/notifications', { params: { limit: 10 } });
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.notifications.filter(n => !n.read).length);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const handleMarkRead = async (id) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <header style={styles.topbar}>
      <div className="navbar-left" style={styles.left}>
        <button
          style={styles.menuBtn}
          onClick={onMenuToggle}
          aria-label="Toggle sidebar"
          id="navbar-menu-toggle"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
        </button>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
            </svg>
          </div>
          <span style={styles.logoText}>Meeting Intelligence</span>
        </div>
      </div>

      <div style={styles.center}>
        <div style={styles.searchBar}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#5F6368" style={{ flexShrink: 0 }}>
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            type="text"
            placeholder="Search meetings, tasks, decisions..."
            style={styles.searchInput}
            id="navbar-search"
          />
        </div>
      </div>

      <div style={styles.right}>
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            style={styles.iconBtn}
            aria-label="Notifications"
            id="navbar-notifications"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
            </svg>
            {unreadCount > 0 && (
              <span style={styles.badge}>{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div style={styles.notifDropdown}>
              <div style={styles.notifHeader}>
                <span style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>Notifications</span>
                {unreadCount > 0 && (
                  <button style={styles.notifMarkAllBtn} onClick={handleMarkAllRead}>
                    Mark all read
                  </button>
                )}
              </div>
              <div style={styles.notifList}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--md-on-surface-variant)', fontSize: 'var(--text-sm)' }}>
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      style={{
                        ...styles.notifItem,
                        background: n.read ? 'transparent' : 'var(--md-primary-container)',
                      }}
                      onClick={() => handleMarkRead(n._id)}
                    >
                      <div style={styles.notifItemTitle}>{n.title}</div>
                      <div style={styles.notifItemMsg}>{n.message}</div>
                      <div style={styles.notifItemTime}>
                        {new Date(n.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div style={styles.avatarWrap} ref={dropdownRef}>
          <button
            style={styles.avatarBtn}
            onClick={() => setShowDropdown(!showDropdown)}
            aria-label="User menu"
            id="navbar-user-menu"
          >
            <div style={styles.avatar}>{userInitial}</div>
          </button>

          {showDropdown && (
            <div style={styles.dropdown}>
              <div style={styles.dropdownHeader}>
                <div style={styles.dropdownAvatar}>{userInitial}</div>
                <div>
                  <div style={styles.dropdownName}>{user?.name}</div>
                  <div style={styles.dropdownEmail}>{user?.email}</div>
                </div>
              </div>
              <div style={styles.dropdownDivider} />
              <button
                style={styles.dropdownItem}
                onClick={logout}
                id="navbar-logout"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

const styles = {
  topbar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 'var(--topbar-height)',
    background: 'var(--md-surface)',
    borderBottom: '1px solid var(--md-outline-variant)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    zIndex: 1000,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  menuBtn: {
    width: '40px',
    height: '40px',
    border: 'none',
    background: 'transparent',
    borderRadius: 'var(--radius-full)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--md-on-surface-variant)',
    transition: 'background var(--transition-fast)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-sm)',
    background: 'linear-gradient(135deg, #1A73E8, #4285F4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 'var(--text-lg)',
    fontWeight: 600,
    color: 'var(--md-on-surface)',
    letterSpacing: '-0.01em',
  },
  center: {
    flex: 1,
    maxWidth: '720px',
    padding: '0 32px',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    height: '46px',
    padding: '0 16px',
    background: 'var(--md-surface-variant)',
    borderRadius: 'var(--radius-2xl)',
    transition: 'all var(--transition-normal)',
    border: '1px solid transparent',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    fontSize: 'var(--text-md)',
    color: 'var(--md-on-surface)',
    outline: 'none',
    fontFamily: 'var(--font-primary)',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  iconBtn: {
    position: 'relative',
    width: '40px',
    height: '40px',
    border: 'none',
    background: 'transparent',
    borderRadius: 'var(--radius-full)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--md-on-surface-variant)',
    transition: 'background var(--transition-fast)',
  },
  badge: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    minWidth: '18px',
    height: '18px',
    borderRadius: '9px',
    background: '#dc2626',
    color: 'white',
    fontSize: '11px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
  },
  notifDropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: '360px',
    background: 'var(--md-surface)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--elevation-3)',
    border: '1px solid var(--md-outline-variant)',
    overflow: 'hidden',
    zIndex: 1001,
    maxHeight: '480px',
    display: 'flex',
    flexDirection: 'column',
  },
  notifHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid var(--md-outline-variant)',
  },
  notifMarkAllBtn: {
    border: 'none',
    background: 'transparent',
    color: 'var(--md-primary)',
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'var(--font-primary)',
  },
  notifList: {
    overflowY: 'auto',
    flex: 1,
  },
  notifItem: {
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid var(--md-outline-variant)',
    transition: 'background var(--transition-fast)',
  },
  notifItemTitle: {
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    color: 'var(--md-on-surface)',
    marginBottom: '2px',
  },
  notifItemMsg: {
    fontSize: 'var(--text-sm)',
    color: 'var(--md-on-surface-variant)',
    marginBottom: '4px',
  },
  notifItemTime: {
    fontSize: 'var(--text-xs)',
    color: 'var(--md-outline)',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarBtn: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: 'var(--radius-full)',
    transition: 'background var(--transition-fast)',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'var(--md-primary)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'var(--text-md)',
    fontWeight: 600,
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: '300px',
    background: 'var(--md-surface)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--elevation-3)',
    border: '1px solid var(--md-outline-variant)',
    overflow: 'hidden',
    zIndex: 1001,
  },
  dropdownHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 20px 16px',
  },
  dropdownAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'var(--md-primary)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'var(--text-xl)',
    fontWeight: 600,
    flexShrink: 0,
  },
  dropdownName: {
    fontSize: 'var(--text-md)',
    fontWeight: 500,
    color: 'var(--md-on-surface)',
  },
  dropdownEmail: {
    fontSize: 'var(--text-sm)',
    color: 'var(--md-on-surface-variant)',
    marginTop: '2px',
  },
  dropdownDivider: {
    height: '1px',
    background: 'var(--md-outline-variant)',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '12px 20px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 'var(--text-base)',
    color: 'var(--md-on-surface)',
    fontFamily: 'var(--font-primary)',
    transition: 'background var(--transition-fast)',
  },
};
