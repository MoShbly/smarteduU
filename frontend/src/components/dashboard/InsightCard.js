import Card from '@/components/ui/Card';

export default function InsightCard({
  eyebrow,
  value,
  title,
  description,
  accent = 'primary',
  icon: Icon
}) {
  return (
    <Card className={`insight-card insight-card--${accent}`} tone="subtle">
      <div className="insight-card-head">
        <div className="insight-card-kicker">
          {Icon ? (
            <span className="insight-card-icon" aria-hidden="true">
              <Icon size={16} />
            </span>
          ) : null}
          <span>{eyebrow}</span>
        </div>
        <strong className="insight-card-value">{value}</strong>
      </div>

      <div className="insight-card-body">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </Card>
  );
}
