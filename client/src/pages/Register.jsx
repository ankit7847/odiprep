import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import AuthShell from "../components/layout/AuthShell";
import TextField from "../components/ui/TextField";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../lib/api";

// Same rules as the server (validators/auth.validator.js), checked early for quick feedback
function validate({ name, email, password }) {
  const e = {};
  if (name.trim().length < 2) e.name = "Enter your name";
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "Enter a valid email";
  if (password.length < 8) e.password = "Use at least 8 characters";
  else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) e.password = "Use at least one letter and one number";
  return e;
}

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [e.target.name]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const errs = validate(form);
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      navigate(from, { replace: true });
    } catch (err) {
      // Server field errors (e.g. email already registered) go next to the field
      const details = err?.response?.data?.details;
      if (details?.length) setFieldErrors(Object.fromEntries(details.map((d) => [d.field, d.message])));
      else if (err?.response?.status === 409) setFieldErrors({ email: errorMessage(err) });
      else setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create your free account" subtitle="Save your progress and track every mock.">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <TextField label="Full name" name="name" autoComplete="name" value={form.name} onChange={onChange} error={fieldErrors.name} />
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={onChange}
          error={fieldErrors.email}
          placeholder="you@example.com"
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={onChange}
          error={fieldErrors.password}
          hint="At least 8 characters, with a letter and a number."
        />
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" state={location.state} className="font-bold text-brand hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
