export default function StatCard({ title, value, icon, subtitle, colorClass = "blue" }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${colorClass}`}>{icon}</div>
      <div className="stat-info">
        <p>{title}</p>
        <h3>{value}</h3>
        {subtitle && (
          <p style={{ fontSize: "12px", opacity: 0.7, marginTop: 4 }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
