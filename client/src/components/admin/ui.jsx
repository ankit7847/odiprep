// Small form building blocks shared by admin pages
export const inputCls =
  "min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:bg-canvas";

export function Field({ label, hint, children, className = "" }) {
  return (
    <label className={`flex flex-col gap-1.5 text-xs font-semibold text-ink ${className}`}>
      {label}
      {children}
      {hint && <span className="text-[11px] font-normal text-muted">{hint}</span>}
    </label>
  );
}

export function Select({ value, onChange, children, ...props }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} {...props}>
      {children}
    </select>
  );
}

const tones = {
  published: "bg-success-soft text-success",
  live: "bg-success-soft text-success",
  draft: "bg-warn-soft text-warn",
  archived: "bg-canvas text-muted",
};

export function StatusPill({ status }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${tones[status] || tones.archived}`}>{status}</span>;
}

export function Notice({ tone = "success", children, onClose }) {
  const cls = { success: "bg-success-soft text-success", error: "bg-danger-soft text-danger", warn: "bg-warn-soft text-warn" }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex items-start justify-between gap-3 rounded-xl px-4 py-3 text-sm ${cls}`}>
      <div className="min-w-0">{children}</div>
      {onClose && (
        <button type="button" onClick={onClose} className="-my-2 min-h-11 shrink-0 text-xs font-bold underline">
          Dismiss
        </button>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[26px] font-extrabold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
