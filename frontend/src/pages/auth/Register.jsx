import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';
import { ROLE_DASHBOARD_PATHS } from '../../utils/constants';
import { validateEmail, validatePassword, validatePhone } from '../../utils/validators';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone_number: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  function handleChange(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Name is required.';
    if (!validateEmail(form.email)) nextErrors.email = 'Enter a valid email address.';
    if (!validatePassword(form.password)) nextErrors.password = 'Password must include 8 characters, one uppercase, and one number.';
    if (!validatePhone(form.phone_number)) nextErrors.phone_number = 'Phone number format is invalid.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    try {
      const response = await register(form);
      navigate(ROLE_DASHBOARD_PATHS[response.user.role], { replace: true });
    } catch (error) {
      setErrors({ general: error.normalizedMessage });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8">
      <div className="rounded-[2.5rem] bg-sand p-10 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Create your account</p>
        <h1 className="mt-6 font-heading text-5xl text-ink">Start booking with the same platform fleet teams rely on.</h1>
        <p className="mt-5 text-slate-600">
          Registration creates a customer account by default. Booking history, profile updates, and dashboard stats are available right away.
        </p>
      </div>
      <div className="glass-panel p-8">
        <h2 className="font-heading text-4xl text-ink">Register</h2>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">Full name</label>
            <input value={form.name} onChange={(event) => handleChange('name', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none" />
            {errors.name ? <p className="mt-2 text-sm text-rose-600">{errors.name}</p> : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">Email</label>
            <input type="email" value={form.email} onChange={(event) => handleChange('email', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none" />
            {errors.email ? <p className="mt-2 text-sm text-rose-600">{errors.email}</p> : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">Phone number</label>
            <input value={form.phone_number} onChange={(event) => handleChange('phone_number', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none" />
            {errors.phone_number ? <p className="mt-2 text-sm text-rose-600">{errors.phone_number}</p> : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">Password</label>
            <input type="password" value={form.password} onChange={(event) => handleChange('password', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none" />
            {errors.password ? <p className="mt-2 text-sm text-rose-600">{errors.password}</p> : null}
          </div>
          {errors.general ? <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{errors.general}</div> : null}
          <button type="submit" disabled={isSubmitting} className="w-full rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white">
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="mt-6 text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-brand">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
