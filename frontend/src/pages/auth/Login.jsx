import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';
import { ROLE_DASHBOARD_PATHS } from '../../utils/constants';
import { validateEmail } from '../../utils/validators';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleChange(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!validateEmail(form.email)) nextErrors.email = 'Enter a valid email address.';
    if (!form.password) nextErrors.password = 'Password is required.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    try {
      const response = await login(form);
      const role = response.user.role;
      const defaultPath = role === 'customer' ? '/' : ROLE_DASHBOARD_PATHS[role];
      const redirectPath = location.state?.from?.pathname || defaultPath;
      navigate(redirectPath, { replace: true });
    } catch (error) {
      setErrors({ general: error.normalizedMessage });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8">
      <div className="rounded-[2.5rem] bg-brand p-10 text-white shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold">Welcome back</p>
        <h1 className="mt-6 font-heading text-5xl">Sign in to manage bookings, vehicles, and customer journeys.</h1>
        <p className="mt-5 text-slate-200">
          Customers can review trips, managers can control fleet inventory, and admins can oversee the full platform from one secure login.
        </p>
      </div>
      <div className="glass-panel p-8">
        <h2 className="font-heading text-4xl text-ink">Login</h2>
        <p className="mt-3 text-sm text-slate-500">Use one of the seeded accounts or create your own customer account.</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => handleChange('email', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
            />
            {errors.email ? <p className="mt-2 text-sm text-rose-600">{errors.email}</p> : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(event) => handleChange('password', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
            />
            {errors.password ? <p className="mt-2 text-sm text-rose-600">{errors.password}</p> : null}
          </div>
          {errors.general ? <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{errors.general}</div> : null}
          <button type="submit" disabled={isSubmitting} className="w-full rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white">
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-sm text-slate-500">
          No account yet?{' '}
          <Link to="/register" className="font-semibold text-brand">
            Create one here
          </Link>
        </p>
      </div>
    </div>
  );
}
