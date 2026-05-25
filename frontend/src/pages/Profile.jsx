import { useEffect, useState } from 'react';

import Loader from '../components/common/Loader';
import { useAuth } from '../hooks/useAuth';
import { validatePhone } from '../utils/validators';

export default function Profile() {
  const { user, hydrateProfile, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: '', phone_number: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function loadProfile() {
      setIsLoading(true);
      try {
        const profile = user || (await hydrateProfile());
        if (!ignore) {
          setForm({ name: profile.name, phone_number: profile.phone_number || '' });
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    loadProfile();
    return () => {
      ignore = true;
    };
  }, [hydrateProfile, user]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validatePhone(form.phone_number)) {
      setError('Phone number format is invalid.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await updateProfile(form);
    } catch (requestError) {
      setError(requestError.normalizedMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <Loader label="Loading profile..." fullScreen />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="glass-panel p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Profile</p>
        <h1 className="mt-4 font-heading text-5xl text-ink">Keep your account details current.</h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">Full name</label>
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">Phone number</label>
            <input value={form.phone_number} onChange={(event) => setForm((current) => ({ ...current, phone_number: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none" />
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
            Email and role are managed on the backend for security. Contact an administrator for role changes.
          </div>
          {error ? <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
          <button type="submit" disabled={isSubmitting} className="rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white">
            {isSubmitting ? 'Saving changes...' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
