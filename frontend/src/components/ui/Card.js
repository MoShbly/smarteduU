export default function Card({
  as: Component = 'article',
  className = '',
  tone = 'default',
  interactive = false,
  children,
  ...props
}) {
  return (
    <Component
      className={[
        'ui-card',
        `ui-card--${tone}`,
        interactive ? 'ui-card--interactive' : '',
        className
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </Component>
  );
}
