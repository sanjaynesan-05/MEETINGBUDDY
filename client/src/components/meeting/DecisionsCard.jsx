export default function DecisionsCard({ decisions = [] }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "20px",
        marginTop: "24px",
      }}
    >
      <h3
        style={{
          fontSize: "18px",
          fontWeight: 600,
          marginBottom: "16px",
        }}
      >
        ✅ Key Decisions
      </h3>

      {decisions.length > 0 ? (
        decisions.map((decision, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <span
              style={{
                color: "#22c55e",
                fontWeight: "bold",
              }}
            >
              ✔
            </span>

            <span>{decision}</span>
          </div>
        ))
      ) : (
        <p>No decisions recorded.</p>
      )}
    </div>
  );
}