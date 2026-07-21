import { FileText } from "lucide-react";

export default function ExecutiveSummary({ summary, summaryPoints }) {
  if (!summary && (!summaryPoints || summaryPoints.length === 0)) {
    return (
      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, marginBottom: "var(--space-4)" }}>
          Executive Summary
        </h3>
        <div className="empty-state">
          <FileText size={18} />
          No summary available.
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: "var(--space-6)", background: "var(--md-surface-dim)", border: "none" }}>
      <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, marginBottom: "var(--space-4)", display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FileText size={20} color="var(--md-primary)" />
        Executive Summary
      </h3>
      
      {summary && (
        <p style={{ fontSize: "var(--text-base)", color: "var(--md-on-surface)", lineHeight: 1.6, marginBottom: summaryPoints?.length ? "var(--space-4)" : "0" }}>
          {summary}
        </p>
      )}
      
      {summaryPoints && summaryPoints.length > 0 && (
        <ul style={{ paddingLeft: "var(--space-5)", color: "var(--md-on-surface)", lineHeight: 1.6 }}>
          {summaryPoints.map((pt, i) => (
            <li key={i} style={{ marginBottom: "var(--space-2)" }}>{pt}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
