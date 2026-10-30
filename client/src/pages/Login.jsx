import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import AuthShell from "../components/layout/AuthShell";
import TextField from "../components/ui/TextField";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../lib/api";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue your practice.">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={onChange}
          placeholder="you@example.com"
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={onChange}
        />
        <Link to="/forgot-password" className="-mt-1 self-end text-xs font-semibold text-brand hover:underline">
          Forgot password?
        </Link>
        <Button type="submit" disabled={busy || !form.email || !form.password} className="w-full">
          {busy ? "Logging in…" : "Log in"}
        </Button>
        <p className="text-center text-sm text-muted">
          New to OdiPrep?{" "}
          <Link to="/register" state={location.state} className="font-bold text-brand hover:underline">
            Create a free account
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
