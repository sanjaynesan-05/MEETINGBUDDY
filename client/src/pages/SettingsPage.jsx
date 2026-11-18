import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { systemAPI } from '../services/systemAPI';

const SERVICE_LABELS = {
  api: { name: 'API server', role: 'Express backend' },
  mongodb: { name: 'MongoDB', role: 'Meetings, transcripts & chunks' },
  qdrant: { name: 'Qdrant', role: 'Vector search for RAG chat' },
  ollama: { name: 'Ollama', role: 'Local LLM & embeddings' },
  whisper: { name: 'Whisper', role: 'Speech-to-text' },
};

function serviceDetail(key, s) {
  if (!s) return '';
  if (key === 'qdrant' && s.available) return `${s.vectors ?? '?'} vectors · ${s.dimension}-dim · ${s.collection}`;
  if (key === 'ollama') return s.available ? `${s.llmModel} · ${s.embeddingModel}` : s.message;
  if (key === 'whisper') return s.available ? `${(s.message || 'installed').replace(/ is available$/, '')}${s.pythonVersion ? ` · ${s.pythonVersion}` : ''}` : s.message;
  // Avoid repeating the status line ("Connected · Connected").
  return s.message && !/^(connected|unavailable)$/i.test(s.message) ? s.message : '';
}

function StatusDot({ ok }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
        background: ok ? 'var(--md-success, #2e7d32)' : 'var(--md-error, #b3261e)',
      }}
    />
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await systemAPI.getStatus();
      setStatus(res.data);
    } catch {
      setError('Could not reach the server to check system status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const services = status ? Object.entries(status.services) : [];
  const allUp = services.length > 0 && services.every(([, s]) => s.available);
  const idx = status && status.index;

  return (
    <div className="page-content">
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Settings</h1>
        <p style={{ color: 'var(--md-on-surface-variant)' }}>Your account and the health of the local AI stack</p>
      </div>

      <section className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 500, marginBottom: 'var(--space-4)' }}>Account</h2>
        <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: 'var(--space-2) var(--space-6)', margin: 0 }}>
          <dt style={{ color: 'var(--md-on-surface-variant)' }}>Name</dt>
          <dd style={{ margin: 0 }}>{user?.name || '—'}</dd>
          <dt style={{ color: 'var(--md-on-surface-variant)' }}>Email</dt>
          <dd style={{ margin: 0, overflowWrap: 'anywhere' }}>{user?.email || '—'}</dd>
          <dt style={{ color: 'var(--md-on-surface-variant)' }}>Member since</dt>
          <dd style={{ margin: 0 }}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</dd>
        </dl>
        <button className="btn btn-secondary" style={{ marginTop: 'var(--space-6)' }} onClick={logout}>
          Sign out
        </button>
      </section>

      <section className="card" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 500, margin: 0 }}>System status</h2>
          <button className="btn btn-text" onClick={load} disabled={loading}>
            {loading ? 'Checking…' : 'Check again'}
          </button>
        </div>

        {error && <div className="alert alert-error" style={{ padding: 16 }}>{error}</div>}

        {!error && status && (
          <>
            <p style={{ color: 'var(--md-on-surface-variant)', marginBottom: 'var(--space-4)' }}>
              {allUp ? 'All services are connected. Uploads, analysis, search and chat are fully available.'
                     : 'Some services are unavailable. Features that depend on them will be limited.'}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 'var(--space-3)' }}>
              {services.map(([key, s]) => (
                <li key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <span style={{ paddingTop: 6 }}><StatusDot ok={s.available} /></span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }}>
                      {SERVICE_LABELS[key]?.name || key}
                      <span style={{ fontWeight: 400, color: 'var(--md-on-surface-variant)' }}> — {SERVICE_LABELS[key]?.role}</span>
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--md-on-surface-variant)', overflowWrap: 'anywhere' }}>
                      {s.available ? 'Connected' : 'Unavailable'}{serviceDetail(key, s) ? ` · ${serviceDetail(key, s)}` : ''}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {idx && (
              <p style={{ marginTop: 'var(--space-6)', fontSize: 'var(--text-sm)', color: 'var(--md-on-surface-variant)' }}>
                Your search index: {idx.embedded} of {idx.meetings} meetings embedded, {idx.chunks} transcript chunks.
              </p>
            )}
          </>
        )}
        {loading && !status && <div className="spinner" />}
      </section>
    </div>
  );
}
