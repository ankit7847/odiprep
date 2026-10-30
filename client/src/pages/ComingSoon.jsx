import { Hammer } from "lucide-react";
import Button from "../components/ui/Button";

// Placeholder for pages that are designed but not built yet
export default function ComingSoon({ title }) {
  return (
    <section className="mx-auto flex max-w-[560px] flex-col items-center gap-4 px-5 py-20 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-brand-soft">
        <Hammer className="size-6 text-brand" aria-hidden="true" />
      </span>
      <h1 className="text-[26px] font-extrabold text-ink">{title}</h1>
      <p className="text-sm text-muted">This page is being built. Check back soon.</p>
      <Button to="/" variant="secondary">
        Back to home
      </Button>
    </section>
  );
}
