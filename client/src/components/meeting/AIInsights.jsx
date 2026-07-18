import { useState } from "react";
import { useAIInsights } from "../../hooks/useAIInsights";
import DecisionsCard from "./DecisionsCard";
import KeywordsCard from "./KeywordsCard";
import MeetingFilterBar from "./MeetingFilterBar";

export default function AIInsights({ meetingId }) {
  const { analysis, loading, error } = useAIInsights(meetingId);
  const [activeFilter, setActiveFilter] = useState("All");

  if (loading) {
    return (
      <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
        Loading AI Insights...
      </div>
    );
  }

  const showSection = (section) => activeFilter === "All" || activeFilter === section;

  return (
    <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "20px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 600 }}>🧠 AI Insights</h2>
        {analysis?.meetingType && (
          <span style={{ background: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)', padding: '4px 12px', borderRadius: '16px', fontSize: '14px', fontWeight: 500 }}>
            {analysis.meetingType}
          </span>
        )}
      </div>

      <MeetingFilterBar activeFilter={activeFilter} setActiveFilter={setActiveFilter} />

      {/* Executive Summary */}
      {showSection("All") && (
        <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "12px", marginBottom: "24px", lineHeight: "1.8" }}>
          <h3 style={{ marginBottom: "12px", fontSize: "18px", fontWeight: 600 }}>Executive Summary</h3>
          <p style={{ color: "#555", fontSize: "16px" }}>{analysis?.summary || "No summary available."}</p>
          
          {analysis?.summaryPoints?.length > 0 && (
            <ul style={{ marginTop: '12px', paddingLeft: '20px', color: '#555' }}>
              {analysis.summaryPoints.map((pt, i) => <li key={i}>{pt}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Agenda & Discussion */}
      {showSection("All") && (
        <div style={{ marginBottom: "24px", display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
                <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: 600 }}>📅 Agenda</h3>
                {analysis?.agenda?.length > 0 ? (
                    <ul style={{ paddingLeft: '20px', color: '#555' }}>
                        {analysis.agenda.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                ) : (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>No agenda items identified.</p>
                )}
            </div>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
                <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: 600 }}>💬 Discussion Points</h3>
                {analysis?.discussionPoints?.length > 0 ? (
                    <ul style={{ paddingLeft: '20px', color: '#555' }}>
                        {analysis.discussionPoints.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                ) : (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>No discussion points identified.</p>
                )}
            </div>
        </div>
      )}

      {/* Action Items */}
      {showSection("Action Item") && (
        <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px", marginBottom: '24px' }}>
          <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: 600 }}>📋 Action Items</h3>
          {analysis?.actionItems?.length > 0 ? (
            analysis.actionItems.map((item, index) => (
              <div key={index} style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "16px" }}>
                <input type="checkbox" disabled style={{ marginTop: "5px" }} />
                <div>
                  <div style={{ fontWeight: 600, marginBottom: "4px" }}>{item.task}</div>
                  <div style={{ fontSize: "14px", color: "#666" }}>
                    👤 {item.owner || "Unassigned"} &nbsp;|&nbsp;
                    ⭐ <span style={{ color: item.priority === 'High' ? '#dc2626' : item.priority === 'Low' ? '#16a34a' : '#ca8a04' }}>{item.priority || "Medium"}</span> &nbsp;|&nbsp;
                    📅 {item.deadline || "No deadline"}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No action items identified.</p>
          )}
        </div>
      )}

      {/* Decisions */}
      {showSection("Decision") && (
        <DecisionsCard decisions={analysis?.decisions || []} />
      )}

      {/* Risks */}
      {showSection("Risk") && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "12px", padding: "20px", marginTop: "24px", marginBottom: '24px' }}>
          <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: 600, color: '#991b1b' }}>⚠️ Risks & Blockers</h3>
          {analysis?.risks?.length > 0 ? (
            <ul style={{ paddingLeft: '20px', color: '#7f1d1d' }}>
              {analysis.risks.map((risk, i) => <li key={i}>{risk}</li>)}
            </ul>
          ) : (
            <p style={{ color: '#991b1b', fontStyle: 'italic' }}>No risks detected.</p>
          )}
        </div>
      )}

      {/* Questions */}
      {showSection("All") && (
        <div style={{ marginBottom: "24px", display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
                <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: 600 }}>❓ Answered Questions</h3>
                {analysis?.questions?.answered?.length > 0 ? (
                    <ul style={{ paddingLeft: '20px', color: '#555' }}>
                        {analysis.questions.answered.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                ) : (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>No answered questions identified.</p>
                )}
            </div>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
                <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: 600 }}>❔ Unanswered Questions</h3>
                {analysis?.questions?.unanswered?.length > 0 ? (
                    <ul style={{ paddingLeft: '20px', color: '#555' }}>
                        {analysis.questions.unanswered.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                ) : (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>No unanswered questions.</p>
                )}
            </div>
        </div>
      )}

      {/* Entities Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {showSection("Person") && (
            <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
                <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: 600 }}>👥 Participants & People</h3>
                {analysis?.people?.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {analysis.people.map((p, i) => (
                            <span key={i} style={{ background: '#f3f4f6', padding: '4px 10px', borderRadius: '16px', fontSize: '13px' }}>{p}</span>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>No participants identified.</p>
                )}
            </div>
        )}

        {(showSection("All") || showSection("Technology")) && (
            <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
                <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: 600 }}>🏢 Organizations</h3>
                {analysis?.organizations?.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {analysis.organizations.map((org, i) => (
                            <span key={i} style={{ background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: '16px', fontSize: '13px' }}>{org}</span>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>No organizations identified.</p>
                )}
            </div>
        )}

        {showSection("Technology") && (
            <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
                <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: 600 }}>💻 Technologies</h3>
                {analysis?.technologies?.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {analysis.technologies.map((tech, i) => (
                            <span key={i} style={{ background: '#fdf4ff', color: '#a21caf', padding: '4px 10px', borderRadius: '16px', fontSize: '13px' }}>{tech}</span>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>No technologies identified.</p>
                )}
            </div>
        )}
      </div>

      {showSection("All") && (
        <KeywordsCard keywords={analysis?.keywords || []} />
      )}

      {/* Follow-up */}
      {showSection("All") && analysis?.followUpRequired && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", padding: "20px", marginTop: "24px" }}>
            <h3 style={{ marginBottom: "12px", fontSize: "18px", fontWeight: 600, color: '#b45309' }}>🔄 Follow-up Required</h3>
            <p style={{ color: '#92400e', fontSize: '15px' }}>{analysis.followUpReason || "No reason provided."}</p>
        </div>
      )}
    </div>
  );
}