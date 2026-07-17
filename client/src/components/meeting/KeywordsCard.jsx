export default function KeywordsCard({ keywords = [] }) {
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
        🏷 Keywords
      </h3>

      {keywords.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          {keywords.map((keyword, index) => (
            <span
              key={index}
              style={{
                background: "#EEF2FF",
                color: "#4338CA",
                padding: "8px 14px",
                borderRadius: "999px",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              {keyword}
            </span>
          ))}
        </div>
      ) : (
        <p>No keywords detected.</p>
      )}
    </div>
  );
}