import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, Menu, Shield, X } from "lucide-react";
import Logo from "../ui/Logo";
import Button from "../ui/Button";
import LanguageToggle from "../ui/LanguageToggle";
import { useAuth } from "../../context/AuthContext";

const links = [
  { to: "/exams", label: "Exams" },
  { to: "/pyq", label: "PYQ Papers", short: "PYQs" },
  { to: "/mock-tests", label: "Mock Tests" },
  { to: "/daily-quiz", label: "Daily Quiz" },
];

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

const linkCls =({ isActive }) => `transition-colors hover:text-brand ${isActive ? "text-brand" : "text-ink"}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  const account = user ? (
    <>
      {user.role === "admin" && (
        <Link to="/admin" className="flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-xs font-bold text-brand hover:underline">
          <Shield className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Admin</span>
        </Link>
      )}
      <Link
        to="/dashboard"
        aria-label={`My dashboard (${user.name})`}
        title="My dashboard"
        className="flex size-11 items-center justify-center rounded-full bg-brand-soft text-sm font-extrabold text-brand hover:ring-2 hover:ring-brand/30"
      >
        {initials(user.name)}
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="hidden min-h-11 items-center gap-1.5 rounded-xl px-2 text-xs font-bold text-muted transition-colors hover:text-ink md:flex"
      >
        <LogOut className="size-4" aria-hidden="true" />
        Log out
      </button>
    </>
  ) : (
    <Button to="/login" variant="secondary" size="sm">
      Login
    </Button>
  );

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 md:h-[84px] md:px-16">
        <Logo />

        <nav aria-label="Main" className="hidden gap-[30px] text-sm font-semibold lg:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkCls}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 md:gap-5">
          <LanguageToggle className="hidden md:inline-flex" />
          {account}
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-xl text-ink md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Phone and tablet: links in a row under the logo */}
      <nav aria-label="Main" className="flex justify-between gap-4 overflow-x-auto px-5 pb-3 text-xs font-semibold md:px-16 lg:hidden">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} className={linkCls}>
            <span className="sm:hidden">{l.short || l.label}</span>
            <span className="hidden sm:inline">{l.label}</span>
          </NavLink>
        ))}
      </nav>

      {open && (
        <div className="flex flex-col gap-4 border-t border-line px-5 py-4 md:hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted">Question language</span>
            <LanguageToggle />
          </div>
          {user && (
            <button type="button" onClick={handleLogout} className="min-h-11 text-left text-sm font-semibold text-ink">
              Log out
            </button>
          )}
          {!user && (
            <Link to="/register" className="min-h-11 text-sm font-semibold text-brand" onClick={() => setOpen(false)}>
              Create a free account
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
