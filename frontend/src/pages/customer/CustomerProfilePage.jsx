import { useEffect, useState } from 'react';

import { uploadProfileImage, uploadLicenseDocument } from '../../api/auth';
import DashboardShell from '../../components/dashboard/DashboardShell';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';
import { validatePhone } from '../../utils/validators';
import { CUSTOMER_LINKS } from '../dashboard/CustomerDashboard';

export default function CustomerProfilePage() {
  const { user, hydrateProfile, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: '', phone_number: '', profile_image_url: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setIsLoading(true);
      try {
        const profile = user || (await hydrateProfile());
        if (!ignore) {
          setForm({
            name: profile.name,
            phone_number: profile.phone_number || '',
            profile_image_url: profile.profile_image_url || '',
          });
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [hydrateProfile, user]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validatePhone(form.phone_number)) { setError('Phone number format is invalid.'); return; }
    setError('');
    setIsSubmitting(true);
    try { await updateProfile(form); }
    catch (err) { setError(err.normalizedMessage || 'Failed to update profile.'); }
    finally { setIsSubmitting(false); }
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const res = await uploadProfileImage(file);
      setForm((c) => ({ ...c, profile_image_url: res.image_url }));
      await updateProfile({ profile_image_url: res.image_url });
    } catch (err) { setError(err.normalizedMessage || 'Upload failed.'); }
    finally { setIsUploadingImage(false); e.target.value = ''; }
  }

  if (isLoading) return <Loader label="Loading profile..." fullScreen />;

  return (
    <DashboardShell title="Profile" subtitle="Manage your account details." links={CUSTOMER_LINKS}>
      <div className="max-w-2xl glass-panel p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">Profile photo</label>
            <div className="flex items-center gap-4">
              {form.profile_image_url ? (
                <img src={form.profile_image_url} alt="Profile" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-500">
                  {form.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <label className="cursor-pointer rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                {isUploadingImage ? 'Uploading...' : 'Upload image'}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={isUploadingImage} />
              </label>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">Full name</label>
            <input value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">Phone number</label>
            <input value={form.phone_number} onChange={(e) => setForm((c) => ({ ...c, phone_number: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none" />
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
            Email is managed by the system and cannot be changed here.
          </div>
          {error && <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
          <button type="submit" disabled={isSubmitting} className="rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white">
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>
    </DashboardShell>
  );
}
