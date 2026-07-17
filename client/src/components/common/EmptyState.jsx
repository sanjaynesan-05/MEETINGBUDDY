import { Link } from 'react-router-dom';
import { Upload } from 'lucide-react';

export default function EmptyState({ 
  icon = <Upload size={32} />, 
  title = "No meetings yet", 
  description = "Upload your first meeting recording to unlock AI transcription, insights, action items, and more.",
  actionLink = "/meetings/upload",
  actionText = "Upload Meeting",
  actionIcon = null,
  onActionClick = null
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon}
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {onActionClick ? (
        <button className="btn btn-primary btn-lg" onClick={onActionClick}>
          {actionIcon}
          {actionText}
        </button>
      ) : actionLink ? (
        <Link to={actionLink} className="btn btn-primary btn-lg">
          {actionIcon}
          {actionText}
        </Link>
      ) : null}
    </div>
  );
}
