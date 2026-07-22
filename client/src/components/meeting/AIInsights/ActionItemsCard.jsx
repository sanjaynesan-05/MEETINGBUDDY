import { ListTodo, Calendar } from "lucide-react";
import { meetingAPI } from "../../../services/meetingAPI";

export default function ActionItemsCard({ actionItems, meetingId }) {
  const handleExportIcs = async () => {
    if (!meetingId) return;
    try {
      const response = await meetingAPI.exportIcs(meetingId);
      const blob = new Blob([response.data], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `action-items.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export ICS:', err);
    }
  };

  return (
    <div className="card" style={{ marginBottom: "var(--space-6)" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--space-4)" }}>
        <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ListTodo size={20} color="#0284c7" />
          Action Items
        </h3>
        {actionItems && actionItems.length > 0 && meetingId && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleExportIcs}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)' }}
            title="Export as .ics calendar file"
          >
            <Calendar size={16} />
            Add to Calendar
          </button>
        )}
      </div>

      {!actionItems || actionItems.length === 0 ? (
        <div className="empty-state">
          <span>🎉</span>
          No pending action items.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {actionItems.map((item, index) => (
            <div key={index} className="action-item">
              <input type="checkbox" disabled style={{ marginTop: "5px", accentColor: 'var(--md-primary)' }} />
              <div>
                <div style={{ fontWeight: 500, marginBottom: "4px", color: 'var(--md-on-surface)' }}>{item.task}</div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--md-on-surface-variant)", display: 'flex', gap: '12px' }}>
                  <span>👤 {item.owner || "Unassigned"}</span>
                  <span>
                    ⭐ <span style={{ color: item.priority === 'High' ? '#dc2626' : item.priority === 'Low' ? '#16a34a' : '#ca8a04', fontWeight: 500 }}>
                      {item.priority || "Medium"}
                    </span>
                  </span>
                  <span>📅 {item.deadline || "No deadline"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
