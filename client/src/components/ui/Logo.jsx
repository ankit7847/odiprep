import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";

export default function Logo({ className = "" }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 ${className}`} aria-label="OdiPrep home">
      <span className="flex h-9 w-[34px] items-center justify-center rounded-[10px] bg-brand">
        <BookOpen className="size-[21px] text-white" strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="text-[23px] font-extrabold text-ink">OdiPrep</span>
    </Link>
  );
}
