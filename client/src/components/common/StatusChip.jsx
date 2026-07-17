export default function StatusChip({ status }) {
  if (!status) return null;
  const normalizedStatus = status.toLowerCase();
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  
  return (
    <span className={`status-badge ${normalizedStatus}`}>
      {normalizedStatus === 'transcribing' && (
        <span 
          className="spinner spinner-sm" 
          style={{ width: '12px', height: '12px', borderWidth: '2px', borderTopColor: 'currentColor', borderColor: 'rgba(0,0,0,0.15)' }} 
        />
      )}
      {label}
    </span>
  );
}
