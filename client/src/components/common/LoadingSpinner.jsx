import '../../styles/index.css';

export default function LoadingSpinner({ fullPage = false, size = 'md' }) {
  if (fullPage) {
    return (
      <div className="spinner-overlay">
        <div className="spinner" />
      </div>
    );
  }

  return <div className={`spinner ${size === 'sm' ? 'spinner-sm' : ''}`} />;
}
