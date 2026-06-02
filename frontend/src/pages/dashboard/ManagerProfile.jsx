import { useEffect, useRef, useState } from 'react';

import { uploadProfileImage, changePassword } from '../../api/auth';
import Loader from '../../components/common/Loader';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { useAuth } from '../../hooks/useAuth';
import { useUiStore } from '../../store/uiStore';

export default function ManagerProfile() {
  const { user, hydrateProfile, updateProfile } = useAuth();
  const fileInputRef = useRef(null);
  const showToast = useUiStore((state) => state.showToast);

  const [form, setForm] = useState({ name: '', email: '', phone_number: '', profile_image_url: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setIsLoading(true);
      try {
        const profile = user || (await hydrateProfile());
        if (!ignore) {
          setForm({
            name: profile.name || '',
            email: profile.email || '',
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

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await updateProfile({ name: form.name, email: form.email, phone_number: form.phone_number });
      showToast({ type: 'success', message: 'Profile updated successfully.' });
    } catch (requestError) {
      setError(requestError.normalizedMessage || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const response = await uploadProfileImage(file);
      setForm((c) => ({ ...c, profile_image_url: response.image_url }));
      await updateProfile({ profile_image_url: response.image_url });
      showToast({ type: 'success', message: 'Profile image updated.' });
    } catch (requestError) {
      showToast({ type: 'error', message: requestError.normalizedMessage || 'Failed to upload image.' });
    } finally {
      setIsUploadingImage(false);
      event.target.value = '';
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    setPasswordError('');
    setIsChangingPassword(true);
    try {
      await changePassword({ current_password: passwordForm.current_password, new_password: passwordForm.new_password });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      showToast({ type: 'success', message: 'Password updated successfully.' });
    } catch (requestError) {
      setPasswordError(requestError.normalizedMessage || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  }

  if (isLoading) return <Loader label="Loading profile..." fullScreen />;

  return (
    <DashboardShell
      title="Update Profile"
      subtitle="Manage your personal details, contact information and security settings."
      links={[
        { label: 'Dashboard',       to: '/dashboard/manager',              end: true },
        { label: 'Add Car',         to: '/dashboard/manager/vehicles/add', end: true },
        { label: 'Manage Cars',     to: '/dashboard/manager/vehicles',     end: true },
        { label: 'Manage Bookings', to: '/dashboard/manager/bookings' },
        { label: 'Update Profile',  to: '/dashboard/manager/profile' },
      ]}
    >
      <div className="max-w-2xl space-y-8">
        {/* Profile details */}
        <div className="glass-panel p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Profile</p>
          <h2 className="mt-2 font-heading text-3xl text-ink">Personal Details</h2>
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Profile image */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">Profile photo</label>
              <div className="flex items-center gap-4">
                {form.profile_image_url ? (
                  <img src={form.profile_image_url} alt="Profile" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-2xl font-bold text-brand">
                    {form.name?.charAt(0)?.toUpperCase() || 'M'}
                  </div>
                )}
                <label className="cursor-pointer rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                  {isUploadingImage ? 'Uploading...' : 'Upload image'}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={isUploadingImage} />
                </label>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">Full name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">Email address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">Phone number</label>
              <input
                value={form.phone_number}
                onChange={(e) => setForm((c) => ({ ...c, phone_number: e.target.value }))}
                placeholder="+91 98765 43210"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            {error ? <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
            <button type="submit" disabled={isSubmitting} className="rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* Password change */}
        <div className="glass-panel p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Security</p>
          <h2 className="mt-2 font-heading text-3xl text-ink">Change Password</h2>
          <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">Current password</label>
              <input
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm((c) => ({ ...c, current_password: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">New password</label>
              <input
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm((c) => ({ ...c, new_password: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">Confirm new password</label>
              <input
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm((c) => ({ ...c, confirm_password: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            {passwordError ? <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{passwordError}</div> : null}
            <button type="submit" disabled={isChangingPassword} className="rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
              {isChangingPassword ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
