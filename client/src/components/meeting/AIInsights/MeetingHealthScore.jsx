import { Activity } from "lucide-react";

export default function MeetingHealthScore({ analysis }) {
  // Simple heuristic for Meeting Health:
  // Baseline 50 + Sentiment(0-20) + Engagement(0-20) - Risks(0-20) + ActionItems(0-10)
  // Or simply rely on AI Insights confidence + sentiment if available
  
  const sentimentScore = analysis?.aiInsights?.sentiment?.score || 0.5; // 0 to 1
  const engagementScore = analysis?.aiInsights?.engagement?.score || 50; // 0 to 100
  const risksPenalty = (analysis?.risks?.length || 0) * 10;
  
  let healthScore = Math.round(
    30 + 
    (sentimentScore * 30) + 
    (engagementScore * 0.4) - 
    Math.min(risksPenalty, 20)
  );
  
  // Clamp between 0 and 100
  healthScore = Math.max(0, Math.min(100, healthScore));

  let color = "var(--md-primary)";
  if (healthScore >= 80) color = "var(--md-success)";
  else if (healthScore <= 50) color = "var(--md-error)";
  else color = "var(--md-warning)";

  return (
    <div className="card card-elevated" style={{ marginBottom: "var(--space-6)" }}>
      <div className="health-score-header" style={{ marginBottom: "var(--space-4)" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} color={color} />
          <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600 }}>Meeting Health</h3>
        </div>
        <div style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: color }}>
          {healthScore}%
        </div>
      </div>
      
      <div className="health-score-container">
        <div className="health-score-bar">
          <div 
            className="health-score-fill" 
            style={{ width: `${healthScore}%`, background: color }} 
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--md-on-surface-variant)' }}>
          <span>Requires Attention</span>
          <span>Excellent</span>
        </div>
      </div>
      
      <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--md-on-surface-variant)' }}>
        Generated from Sentiment, Engagement, Risks, and Action Items.
      </div>
    </div>
  );
}
