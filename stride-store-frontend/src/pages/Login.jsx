import React from "react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/format";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(form.email, form.password);
      navigate(location.state?.from || "/shop", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue shopping.">
      <form className="form-card" onSubmit={handleSubmit}>
        <FormInput label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <FormInput label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        {error && <div className="form-error">{error}</div>}
        <button className="button button-dark button-full" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>
        <p className="form-foot">New here? <Link to="/register">Create an account</Link></p>
      </form>
    </AuthLayout>
  );
}

export function AuthLayout({ title, subtitle, children }) {
  return (
    <section className="auth-page">
      <div className="auth-aside">
        <span className="eyebrow">STRIDE</span>
        <h1>EVERY MOVE<br />COUNTS.</h1>
        <p>A clean storefront experience backed by your real API.</p>
      </div>
      <div className="auth-panel">
        <div className="auth-heading"><span className="eyebrow">ACCOUNT</span><h2>{title}</h2><p>{subtitle}</p></div>
        {children}
      </div>
    </section>
  );
}

export function FormInput({ label, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}

export default Login;
