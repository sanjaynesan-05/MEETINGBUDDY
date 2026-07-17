export default function Button({ 
  children, 
  variant = 'primary', 
  size = '', 
  className = '', 
  icon,
  ...props 
}) {
  const sizeClass = size ? `btn-${size}` : '';
  return (
    <button className={`btn btn-${variant} ${sizeClass} ${className}`.trim()} {...props}>
      {icon && <span className="btn-icon">{icon}</span>}
      {children}
    </button>
  );
}
