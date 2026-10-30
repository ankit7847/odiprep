import { Link } from "react-router-dom";
import Logo from "../ui/Logo";

const groups = [
  {
    title: "Explore",
    links: [
      { to: "/exams", label: "All exams" },
      { to: "/pyq", label: "PYQ Papers" },
      { to: "/daily-quiz", label: "Daily Quiz" },
    ],
  },
  {
    title: "OdiPrep",
    links: [
      { to: "/about", label: "About us" },
      { to: "/contact", label: "Contact" },
      { to: "/privacy", label: "Privacy & terms" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-white">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-7 px-5 py-8 md:px-16">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex max-w-[400px] flex-col gap-3">
            <Logo />
            <p className="text-[13px] text-muted">Built for Odisha’s aspirants. Free by choice.</p>
            <p className="text-[11px] text-muted">
              Independent practice platform. Not affiliated with any government recruitment board.
            </p>
          </div>
          <div className="flex gap-14 text-xs">
            {groups.map((g) => (
              <div key={g.title} className="flex flex-col gap-3">
                <p className="font-extrabold text-ink">{g.title}</p>
                {g.links.map((l) => (
                  <Link key={l.to} to={l.to} className="text-muted hover:text-brand">
                    {l.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="h-px bg-line" />
        <div className="flex items-start justify-between gap-4 text-[11px] text-muted">
          <p>© 2026 OdiPrep. Made for your next opportunity.</p>
          <p className="hidden whitespace-nowrap font-odia md:block">English · ଓଡ଼ିଆ</p>
        </div>
      </div>
    </footer>
  );
}
