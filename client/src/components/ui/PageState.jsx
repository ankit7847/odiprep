import { AlertCircle } from "lucide-react";
import Button from "./Button";

export function Loading({ label = "Loading…" }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 px-5 py-20 text-sm text-muted">
      <span className="size-4 animate-spin rounded-full border-2 border-line border-t-brand" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry, backTo = "/" }) {
  return (
    <div className="mx-auto flex max-w-[480px] flex-col items-center gap-4 px-5 py-20 text-center">
      <AlertCircle className="size-8 text-danger" aria-hidden="true" />
      <p className="text-sm text-ink">{message}</p>
      <div className="flex gap-2.5">
        {onRetry && <Button onClick={onRetry}>Try again</Button>}
        <Button to={backTo} variant="secondary">
          Go back
        </Button>
      </div>
    </div>
  );
}
