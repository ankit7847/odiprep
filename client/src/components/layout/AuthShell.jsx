import { CheckCircle2 } from "lucide-react";

const perks = ["Your progress saved across devices", "Score trends and weak topics", "Daily streak and mistake notebook"];

// Two-column frame for login / register: form on the left, reasons to sign up on the right
export default function AuthShell({ title, subtitle, children }) {
  return (
    <section className="mx-auto flex w-full max-w-[1440px] gap-16 px-5 py-10 md:px-16 md:py-16">
      <div className="mx-auto w-full max-w-[440px] lg:mx-0">
        <div className="rounded-2xl border border-line bg-white p-6 shadow-card md:p-8">
          <h1 className="text-[26px] font-extrabold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>

      <aside className="hidden flex-1 flex-col justify-center gap-5 lg:flex">
        <span className="self-start rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand">
          100% free · Built for Odisha
        </span>
        <p className="max-w-[520px] text-[36px] leading-[1.3] font-extrabold text-ink">
          Practise today. Walk into the exam hall ready.
        </p>
        <p lang="or" className="font-odia text-[17px] text-muted">
          ନିଜ ଭାଷାରେ ପ୍ରସ୍ତୁତି କରନ୍ତୁ।
        </p>
        <ul className="flex flex-col gap-3">
          {perks.map((p) => (
            <li key={p} className="flex items-center gap-2.5 text-sm font-semibold text-ink">
              <CheckCircle2 className="size-[18px] text-brand" aria-hidden="true" />
              {p}
            </li>
          ))}
        </ul>
      </aside>
    </section>
  );
}
