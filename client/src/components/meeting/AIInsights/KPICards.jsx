import { Users, CheckCircle2, ListTodo, AlertTriangle, ShieldCheck } from "lucide-react";

export default function KPICards({ analysis }) {
  const participantsCount = analysis?.people?.length || 0;
  const decisionsCount = analysis?.decisions?.length || 0;
  const actionItemsCount = analysis?.actionItems?.length || 0;
  const risksCount = analysis?.risks?.length || 0;
  const confidenceScore = analysis?.aiInsights?.confidence || 0;

  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <div className="kpi-icon"><Users size={24} /></div>
        <div className="kpi-label">Participants</div>
        <div className="kpi-value">{participantsCount}</div>
      </div>
      
      <div className="kpi-card">
        <div className="kpi-icon"><CheckCircle2 size={24} color="#16a34a" /></div>
        <div className="kpi-label">Decisions</div>
        <div className="kpi-value">{decisionsCount}</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon"><ListTodo size={24} color="#0284c7" /></div>
        <div className="kpi-label">Action Items</div>
        <div className="kpi-value">{actionItemsCount}</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon"><AlertTriangle size={24} color={risksCount > 0 ? "#dc2626" : "#64748b"} /></div>
        <div className="kpi-label">Risks</div>
        <div className="kpi-value">{risksCount}</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon"><ShieldCheck size={24} color="#8b5cf6" /></div>
        <div className="kpi-label">AI Confidence</div>
        <div className="kpi-value">{confidenceScore}%</div>
      </div>
    </div>
  );
}
