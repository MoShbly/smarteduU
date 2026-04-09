export default function Badge({ tone = 'neutral', className = '', children }) {
  return (
    <span className={['ui-badge', `ui-badge--${tone}`, className].filter(Boolean).join(' ')}>
      {children}
    </span>
  );
}
