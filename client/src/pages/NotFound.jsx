import Button from "../components/ui/Button";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-[560px] flex-col items-center gap-4 px-5 py-20 text-center">
      <p className="text-sm font-extrabold text-brand">404</p>
      <h1 className="text-[26px] font-extrabold text-ink">Page not found</h1>
      <p className="text-sm text-muted">The page you are looking for doesn’t exist or has moved.</p>
      <Button to="/">Back to home</Button>
    </section>
  );
}
