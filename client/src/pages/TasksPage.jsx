import { useState, useEffect, useCallback } from 'react';
import { tasksAPI } from '../services/tasksAPI';
import { CheckCircle, Circle, AlertTriangle, Calendar, User, Filter, ArrowUpDown, Search } from 'lucide-react';

const PRIORITY_COLORS = {
  High: '#dc2626',
  Medium: '#ca8a04',
  Low: '#16a34a',
};

const STATUS_OPTIONS = ['All', 'Pending', 'In Progress', 'Completed'];
const PRIORITY_OPTIONS = ['All', 'High', 'Medium', 'Low'];
const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'priority', label: 'Priority' },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { sort: sortBy };
      if (statusFilter !== 'All') params.status = statusFilter;
      if (priorityFilter !== 'All') params.priority = priorityFilter;
      const res = await tasksAPI.getAll(params);
      setTasks(res.data.tasks || []);
      setStats(res.data.stats || { total: 0, pending: 0, overdue: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [sortBy, statusFilter, priorityFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      const res = await tasksAPI.update(task.meetingId, task.index, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (searchTerm && !t.task.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="page-content">
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
          Tasks
        </h1>
        <p style={{ color: 'var(--md-on-surface-variant)' }}>
          Action items extracted from all your meetings
        </p>
      </div>

      {!loading && !error && (
        <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
          <div style={statCardStyle('#1E88E5')}>
            <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#1E88E5' }}>{stats.total}</span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--md-on-surface-variant)' }}>Total Tasks</span>
          </div>
          <div style={statCardStyle('#FB8C00')}>
            <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#FB8C00' }}>{stats.pending}</span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--md-on-surface-variant)' }}>Pending</span>
          </div>
          <div style={statCardStyle(stats.overdue > 0 ? '#dc2626' : '#16a34a')}>
            <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: stats.overdue > 0 ? '#dc2626' : '#16a34a' }}>{stats.overdue}</span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--md-on-surface-variant)' }}>Overdue</span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--md-surface-variant)', borderRadius: 'var(--radius-2xl)', padding: '0 12px', flex: 1, minWidth: '200px' }}>
          <Search size={18} color="var(--md-on-surface-variant)" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', padding: '10px 0', outline: 'none', flex: 1, fontSize: 'var(--text-base)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={16} color="var(--md-on-surface-variant)" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
            {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={selectStyle}>
            {PRIORITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <ArrowUpDown size={16} color="var(--md-on-surface-variant)" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={selectStyle}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" />
          <p style={{ marginTop: '16px', color: 'var(--md-on-surface-variant)' }}>Loading tasks...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ padding: '16px' }}>
          {error}
        </div>
      )}

      {!loading && !error && filteredTasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--md-on-surface-variant)' }}>
          <CheckCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
          <h3 style={{ fontWeight: 500, marginBottom: '8px' }}>No tasks found</h3>
          <p>All caught up! No pending action items.</p>
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {filteredTasks.map(task => (
            <div key={task.id} className="card" style={{ padding: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
              <button
                onClick={() => handleToggleStatus(task)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', marginTop: '2px' }}
                title={task.status === 'Completed' ? 'Mark pending' : 'Mark completed'}
              >
                {task.status === 'Completed' ? (
                  <CheckCircle size={22} color="#16a34a" />
                ) : (
                  <Circle size={22} color="var(--md-outline)" />
                )}
              </button>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 500,
                    textDecoration: task.status === 'Completed' ? 'line-through' : 'none',
                    color: task.status === 'Completed' ? 'var(--md-on-surface-variant)' : 'var(--md-on-surface)',
                  }}>
                    {task.task}
                  </span>
                  <span style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: PRIORITY_COLORS[task.priority] + '20',
                    color: PRIORITY_COLORS[task.priority],
                  }}>
                    {task.priority}
                  </span>
                  <span className={`status-badge ${task.status.toLowerCase().replace(' ', '-')}`}>
                    {task.status}
                  </span>
                  {new Date(task.deadline) < new Date() && task.status !== 'Completed' && (
                    <span style={{ fontSize: 'var(--text-xs)', color: '#dc2626', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={12} /> Overdue
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--md-on-surface-variant)', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={14} />
                    {task.owner || 'Unassigned'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} />
                    {task.deadline || 'No deadline'}
                  </span>
                  <span style={{ color: 'var(--md-primary)', cursor: 'pointer' }}>
                    {task.meetingTitle}
                  </span>
                </div>
              </div>

              <select
                value={task.status}
                onChange={async (e) => {
                  const newStatus = e.target.value;
                  try {
                    await tasksAPI.update(task.meetingId, task.index, { status: newStatus });
                    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
                  } catch (err) {
                    console.error('Failed to update status:', err);
                  }
                }}
                style={{
                  ...selectStyle,
                  fontSize: 'var(--text-xs)',
                  padding: '4px 8px',
                  minWidth: '100px',
                }}
              >
                {STATUS_OPTIONS.filter(s => s !== 'All').map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const statCardStyle = (color) => ({
  background: `${color}10`,
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-4) var(--space-5)',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  minWidth: '140px',
  border: `1px solid ${color}30`,
});

const selectStyle = {
  padding: '8px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--md-outline-variant)',
  background: 'var(--md-surface)',
  fontSize: 'var(--text-sm)',
  color: 'var(--md-on-surface)',
  outline: 'none',
  cursor: 'pointer',
};
