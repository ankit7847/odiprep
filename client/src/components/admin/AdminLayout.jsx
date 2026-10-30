import { NavLink, Outlet } from "react-router-dom";
import { ClipboardList, FileSpreadsheet, LayoutDashboard, ListChecks } from "lucide-react";

const links = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/questions", label: "Questions", icon: ListChecks },
  { to: "/admin/upload", label: "Excel upload", icon: FileSpreadsheet },
  { to: "/admin/tests", label: "Tests", icon: ClipboardList },
];

export default function AdminLayout() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col lg:flex-row">
      <aside className="border-line bg-white lg:min-h-[calc(100vh-84px)] lg:w-[232px] lg:shrink-0 lg:border-r">
        <p className="hidden px-6 pt-6 text-[11px] font-bold text-muted lg:block">ADMIN</p>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto border-b border-line px-4 py-2 lg:flex-col lg:gap-2 lg:border-0 lg:p-6 lg:pt-4">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-11 shrink-0 items-center gap-3 rounded-[10px] px-3 text-xs whitespace-nowrap ${
                  isActive ? "bg-brand-soft font-extrabold text-brand" : "font-medium text-muted hover:bg-canvas"
                }`
              }
            >
              <Icon className="size-[18px]" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col gap-6 p-5 md:p-9">
        <Outlet />
      </div>
    </div>
  );
}
