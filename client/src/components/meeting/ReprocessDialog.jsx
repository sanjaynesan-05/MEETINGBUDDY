import { useState } from 'react';
import { SPOKEN_LANGUAGES } from '../../utils/languages';

const OPTIONS = [
  {
    mode: 'analysis',
    label: 'Re-run AI analysis',
    help: 'Keeps the transcript; regenerates summary, decisions, action items and the search index. A few minutes.',
  },
  {
    mode: 'full',
    label: 'Re-transcribe from the recording',
    help: 'Transcribes the audio again, then re-runs analysis and indexing. Use this if the transcript is wrong. Slowest.',
  },
  {
    mode: 'embeddings',
    label: 'Rebuild search index only',
    help: 'Re-indexes this meeting for search and chat. Under a minute.',
  },
];

export default function ReprocessDialog({ isOpen, onCancel, onConfirm, loading = false, error = '', currentLanguage = '' }) {
  const [mode, setMode] = useState('analysis');
  const [language, setLanguage] = useState(currentLanguage || '');
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={loading ? undefined : onCancel}>
      <div className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="reprocess-title" onClick={(e) => e.stopPropagation()}>
        <h3 id="reprocess-title">Re-process meeting</h3>
        <p>Choose what to run again. The meeting stays available while it works.</p>

        <fieldset style={{ border: 0, padding: 0, margin: '0 0 var(--space-4)', display: 'grid', gap: 'var(--space-3)' }}>
          <legend className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
            Re-process option
          </legend>
          {OPTIONS.map((o) => (
            <label key={o.mode} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="radio"
                name="reprocess-mode"
                value={o.mode}
                checked={mode === o.mode}
                onChange={() => setMode(o.mode)}
                disabled={loading}
                style={{ marginTop: 4 }}
              />
              <span>
                <span style={{ fontWeight: 500, display: 'block' }}>{o.label}</span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--md-on-surface-variant)' }}>{o.help}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {mode === 'full' && (
          <label style={{ display: 'block', marginBottom: 'var(--space-4)' }}>
            <span style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>Spoken language</span>
            <select
              className="form-input"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={loading}
              style={{ width: '100%' }}
            >
              {SPOKEN_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
            <span style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--md-on-surface-variant)', marginTop: 4 }}>
              Choose the language if automatic detection got it wrong.
            </span>
          </label>
        )}

        {error && (
          <div className="alert alert-error" role="alert" style={{ padding: 12, marginBottom: 'var(--space-4)' }}>{error}</div>
        )}

        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onConfirm(mode, mode === 'full' ? language : undefined)} disabled={loading}>
            {loading ? 'Starting…' : 'Start'}
          </button>
        </div>
      </div>
    </div>
  );
}
