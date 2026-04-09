'use client';

const formatValueOutput = (value, name, valueFormatter) => {
  if (!valueFormatter) {
    return {
      value,
      label: name
    };
  }

  const result = valueFormatter(value, name);

  if (Array.isArray(result)) {
    return {
      value: result[0],
      label: result[1]
    };
  }

  return {
    value: result,
    label: name
  };
};

export default function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const resolvedLabel = labelFormatter ? labelFormatter(label) : label;

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{resolvedLabel}</div>

      <div className="chart-tooltip-list">
        {payload.map((entry) => {
          const { value, label: itemLabel } = formatValueOutput(entry.value, entry.name, valueFormatter);
          const indicatorColor =
            entry.stroke && !String(entry.stroke).startsWith('url(')
              ? entry.stroke
              : entry.fill && !String(entry.fill).startsWith('url(')
                ? entry.fill
                : 'var(--chart-accent)';

          return (
            <div className="chart-tooltip-item" key={`${entry.dataKey}-${entry.value}`}>
              <span
                className="chart-tooltip-swatch"
                style={{ background: indicatorColor }}
                aria-hidden="true"
              />
              <div className="chart-tooltip-copy">
                <span className="chart-tooltip-meta">{itemLabel}</span>
                <strong className="chart-tooltip-value">{value}</strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
