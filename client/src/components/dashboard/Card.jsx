export default function Card({ title, subtitle, badge, action, className = "", children }) {
  return (
    <section className={`flex min-w-0 flex-col gap-[18px] rounded-2xl border border-line bg-white p-5 shadow-card md:p-6 ${className}`}>
      {(title || badge || action) && (
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 className="text-[17px] font-extrabold text-ink">{title}</h2>
            {subtitle && <p className="text-[11px] text-muted">{subtitle}</p>}
          </div>
          {badge}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const pill = {
  success: "bg-success-soft text-success",
  warn: "bg-warn-soft text-warn",
  brand: "bg-brand-soft text-brand",
  muted: "bg-canvas text-muted",
};

export function Pill({ tone = "brand", children }) {
  return <span className={`shrink-0 self-start rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${pill[tone]}`}>{children}</span>;
}
