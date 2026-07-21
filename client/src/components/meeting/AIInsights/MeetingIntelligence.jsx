import { BrainCircuit } from "lucide-react";

export default function MeetingIntelligence({ analysis }) {
  const meetingType = analysis?.meetingType || "Unknown";
  const intent = analysis?.aiInsights?.intent || "Unknown";
  const tone = analysis?.aiInsights?.meetingTone || "Unknown";
  const emotion = analysis?.aiInsights?.emotion?.primary || "Unknown";
  const sentiment = analysis?.aiInsights?.sentiment?.overall || "Unknown";

  return (
    <div className="card" style={{ marginBottom: "var(--space-6)" }}>
      <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, marginBottom: "var(--space-4)", display: 'flex', alignItems: 'center', gap: '8px' }}>
        <BrainCircuit size={20} color="var(--md-primary)" />
        Meeting Intelligence
      </h3>
      
      <div className="intelligence-grid">
        <div className="intelligence-item">
          <span className="intelligence-label">Meeting Type</span>
          <span className="intelligence-value">{meetingType}</span>
        </div>
        
        <div className="intelligence-item">
          <span className="intelligence-label">Intent</span>
          <span className="intelligence-value">{intent}</span>
        </div>
        
        <div className="intelligence-item">
          <span className="intelligence-label">Tone</span>
          <span className="intelligence-value">{tone}</span>
        </div>
        
        <div className="intelligence-item">
          <span className="intelligence-label">Primary Emotion</span>
          <span className="intelligence-value">{emotion}</span>
        </div>
        
        <div className="intelligence-item">
          <span className="intelligence-label">Overall Sentiment</span>
          <span className="intelligence-value">{sentiment}</span>
        </div>
      </div>
    </div>
  );
}
