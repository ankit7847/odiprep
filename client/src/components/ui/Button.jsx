import { Link } from "react-router-dom";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const variants = {
  primary: "border-brand bg-brand text-white hover:bg-brand-dark hover:border-brand-dark",
  secondary: "border-line bg-white text-brand hover:border-brand",
  inverse: "border-white bg-white text-brand hover:bg-brand-soft",
};

const sizes = { md: "", sm: "px-3.5 text-xs" };

// <Button to="/x"> renders a link, otherwise a <button>
export default function Button({ to, variant = "primary", size = "md", className = "", children, ...props }) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  if (to) {
    return (
      <Link to={to} className={cls} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
