import type { InputHTMLAttributes, ReactNode } from "react";

export function MzCard({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag type={onClick ? "button" : undefined} className={`mz-card ${className}`} onClick={onClick}>
      {children}
    </Tag>
  );
}

export function MzSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mz-card mz-section">
      <p className="mz-section-title">{title}</p>
      <div className="mz-stack">{children}</div>
    </div>
  );
}

export function MzField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mz-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function MzInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="mz-input" {...props} />;
}

export function MzPrimaryButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" className="mz-btn-primary mz-btn-block" onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

export function MzChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`mz-chip ${active ? "is-active" : ""}`} onClick={onClick}>
      {label}
    </button>
  );
}

export function MzScreenTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mz-screen-title">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}

export function MzNavyHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mz-navy-header">
      <div>
        <p className="mz-brand-eyebrow">MobiZone</p>
        <h1>{title}</h1>
        {subtitle ? <p className="mz-navy-sub">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}

export function MzBadge({
  label,
  tone = "teal",
}: {
  label: string;
  tone?: "teal" | "orange" | "rose";
}) {
  return <span className={`mz-badge mz-badge--${tone}`}>{label}</span>;
}

export function MzEmpty({
  title,
  note,
  actionLabel,
  onAction,
}: {
  title: string;
  note?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mz-card mz-empty">
      <strong>{title}</strong>
      {note ? <p>{note}</p> : null}
      {actionLabel && onAction ? (
        <button type="button" className="mz-btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function MzRow({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="mz-kv">
      <span>{label}</span>
      <strong style={tone ? { color: tone } : undefined}>{value}</strong>
    </div>
  );
}

export function MzDateRangeChips({
  fromDate,
  toDate,
  onChange,
}: {
  fromDate: string;
  toDate: string;
  onChange: (from: string, to: string) => void;
}) {
  const today = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return {
      ymd: `${y}-${m}-${day}`,
      monthStart: `${y}-${m}-01`,
      yearStart: `${y}-01-01`,
    };
  })();
  const presets = [
    { label: "Today", from: today.ymd, to: today.ymd },
    { label: "Month", from: today.monthStart, to: today.ymd },
    { label: "Year", from: today.yearStart, to: today.ymd },
    { label: "All", from: "", to: "" },
  ] as const;

  return (
    <div className="mz-stack">
      <div className="mz-grid-2">
        <MzField label="From date">
          <MzInput
            type="date"
            value={fromDate}
            onChange={(e) => onChange(e.target.value, toDate)}
          />
        </MzField>
        <MzField label="To date">
          <MzInput
            type="date"
            value={toDate}
            onChange={(e) => onChange(fromDate, e.target.value)}
          />
        </MzField>
      </div>
      <div className="mz-chip-row">
        {presets.map((p) => {
          const active = fromDate === p.from && toDate === p.to;
          return (
            <MzChip
              key={p.label}
              label={p.label}
              active={active}
              onClick={() => onChange(p.from, p.to)}
            />
          );
        })}
      </div>
    </div>
  );
}
