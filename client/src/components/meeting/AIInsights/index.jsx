import { useAIInsights } from "../../../hooks/useAIInsights";
import KPICards from "./KPICards";
import MeetingHealthScore from "./MeetingHealthScore";
import ExecutiveSummary from "./ExecutiveSummary";
import MeetingIntelligence from "./MeetingIntelligence";
import DecisionsCard from "./DecisionsCard";
import ActionItemsCard from "./ActionItemsCard";
import RisksCard from "./RisksCard";
import EntitiesCard from "./EntitiesCard";
import QuestionsCard from "./QuestionsCard";

export default function AIInsights({ meetingId, meetingStatus }) {
  const { analysis, loading, error } = useAIInsights(meetingId, meetingStatus);

  if (loading) {
    return (
      <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="spinner spinner-sm" />
          <span style={{ fontSize: 'var(--text-md)', color: 'var(--md-on-surface-variant)' }}>Loading AI Insights...</span>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return null;
  }

  return (
    <div className="ai-dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--space-2)" }}>
        <h2 style={{ fontSize: "var(--text-3xl)", fontWeight: 600, color: 'var(--md-on-surface)' }}>
          🧠 AI Dashboard
        </h2>
        {analysis?.meetingType && (
          <span style={{ background: 'var(--md-primary-container)', color: 'var(--md-primary)', padding: '6px 16px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
            {analysis.meetingType}
          </span>
        )}
      </div>

      <KPICards analysis={analysis} />
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-2)' }}>
        <MeetingHealthScore analysis={analysis} />
        <MeetingIntelligence analysis={analysis} />
      </div>

      <ExecutiveSummary summary={analysis.summary} summaryPoints={analysis.summaryPoints} />
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 'var(--space-6)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <ActionItemsCard actionItems={analysis.actionItems} />
          <RisksCard risks={analysis.risks} />
          <DecisionsCard decisions={analysis.decisions} />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <EntitiesCard 
            keywords={analysis.keywords} 
            people={analysis.people} 
            organizations={analysis.organizations} 
            technologies={analysis.technologies} 
          />
          <QuestionsCard questions={analysis.questions} />
        </div>
      </div>

      {analysis.followUpRequired && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "var(--radius-md)", padding: "var(--space-6)", marginTop: "var(--space-2)" }}>
          <h3 style={{ marginBottom: "var(--space-3)", fontSize: "var(--text-lg)", fontWeight: 600, color: '#b45309' }}>
            🔄 Follow-up Required
          </h3>
          <p style={{ color: '#92400e', fontSize: 'var(--text-base)' }}>
            {analysis.followUpReason || "No reason provided."}
          </p>
        </div>
      )}
    </div>
  );
}
