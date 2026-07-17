import { useAIInsights } from "../../hooks/useAIInsights";
import DecisionsCard from "./DecisionsCard";
import KeywordsCard from "./KeywordsCard";

export default function AIInsights({ meetingId }) {
  const { analysis, loading, error } = useAIInsights(meetingId);

  if (loading) {
    return (
      <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
        Loading AI Insights...
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
      <h2
        style={{
          fontSize: "24px",
          fontWeight: 600,
          marginBottom: "20px",
        }}
      >
        🧠 AI Insights
      </h2>

      {/* Executive Summary */}
      <div
        style={{
          background: "#f8fafc",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "24px",
          lineHeight: "1.8",
        }}
      >
        <h3
          style={{
            marginBottom: "12px",
            fontSize: "18px",
            fontWeight: 600,
          }}
        >
          Executive Summary
        </h3>

        <p
          style={{
            color: "#555",
            fontSize: "16px",
          }}
        >
          {analysis?.summary || "No summary available."}
        </p>
      </div>

      {/* Action Items */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <h3
          style={{
            marginBottom: "16px",
            fontSize: "18px",
            fontWeight: 600,
          }}
        >
          📋 Action Items
        </h3>

        {analysis?.actionItems?.length > 0 ? (
          analysis.actionItems.map((item) => (
            <div
              key={item._id || item.task}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <input
                type="checkbox"
                disabled
                style={{ marginTop: "5px" }}
              />

              <div>
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  {item.task}
                </div>

                <div
                  style={{
                    fontSize: "14px",
                    color: "#666",
                  }}
                >
                  👤 {item.owner || "Unassigned"} &nbsp;|&nbsp;
                  ⭐ {item.priority || "Medium"} &nbsp;|&nbsp;
                  📅 {item.deadline || "No deadline"}
                </div>
              </div>
            </div>
            
          ))
        ) : (
          <p>No action items found.</p>
        )}
      </div>

      <DecisionsCard decisions={analysis?.decisions || []} />
      <KeywordsCard keywords={analysis?.keywords || []} />
    </div>
  );
}