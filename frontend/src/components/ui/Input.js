'use client';

export default function Input({
  id,
  label,
  error,
  hint,
  icon: Icon,
  trailingControl,
  multiline = false,
  rows = 4,
  className = '',
  controlClassName = '',
  labelAction,
  ...props
}) {
  const Control = multiline ? 'textarea' : 'input';

  return (
    <label className={['field', error ? 'has-error' : '', className].filter(Boolean).join(' ')} htmlFor={id}>
      {label ? (
        <span className="field-label-row">
          <span className="field-label">{label}</span>
          {labelAction ? <span className="field-label-action">{labelAction}</span> : null}
        </span>
      ) : null}

      <span
        className={['field-control', Icon ? 'has-icon' : '', controlClassName].filter(Boolean).join(' ')}
      >
        {Icon ? (
          <span className="field-icon" aria-hidden="true">
            <Icon size={16} />
          </span>
        ) : null}
        <Control id={id} rows={multiline ? rows : undefined} {...props} />
        {trailingControl ? <span className="field-trailing">{trailingControl}</span> : null}
      </span>

      {error ? <span className="field-feedback field-feedback--error">{error}</span> : null}
      {!error && hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}
