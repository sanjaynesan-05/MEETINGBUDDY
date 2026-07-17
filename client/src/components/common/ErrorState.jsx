import { useNavigate } from 'react-router-dom';

export default function ErrorState({ title = "Something went wrong", message = "An error occurred.", actionText = "Go Back", onActionClick, actionLink }) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onActionClick) {
      onActionClick();
    } else if (actionLink) {
      navigate(actionLink);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="var(--md-error)">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
      </div>
      <h2>{title}</h2>
      <p>{message}</p>
      <button className="btn btn-primary" onClick={handleClick}>
        {actionText}
      </button>
    </div>
  );
}
