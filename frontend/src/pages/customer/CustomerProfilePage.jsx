import { useEffect, useState } from 'react';

import { uploadProfileImage, uploadLicenseDocument, changePassword } from '../../api/auth';
import DashboardShell from '../../components/dashboard/DashboardShell';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';
import { useUiStore } from '../../store/uiStore';
import { CUSTOMER_LINKS } from '../dashboard/CustomerDashboard';

export default function CustomerProfilePage() {
  const { user, hydrateProfile, updateProfile } = useAuth();
  const showToast = useUiStore((state) => state.showToast);

  const [form, setForm] = useState({ name: '', email: '', phone_number: '', profile_image_url: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [licenseForm, setLicenseForm] = useState({ license_number: '', license_document_url: '' });
  const [licenseError, setLicenseError] = useState('');
  const [isLicenseSubmitting, setIsLicenseSubmitting] = useState(false);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);

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
          setLicenseForm({
            license_number: profile.license_number || profile.driving_license_number || '',
            license_document_url: profile.license_document_url || '',
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
    setError('');
    setIsSubmitting(true);
    try {
      await updateProfile({ name: form.name, email: form.email, phone_number: form.phone_number });
      showToast({ type: 'success', message: 'Profile updated successfully.' });
    } catch (err) {
      setError(err.normalizedMessage || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const res = await uploadProfileImage(file);
      setForm((c) => ({ ...c, profile_image_url: res.image_url }));
      await updateProfile({ profile_image_url: res.image_url });
      showToast({ type: 'success', message: 'Profile image updated.' });
    } catch (err) {
      showToast({ type: 'error', message: err.normalizedMessage || 'Upload failed.' });
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
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
    } catch (err) {
      setPasswordError(err.normalizedMessage || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleLicenseSubmit(e) {
    e.preventDefault();
    if (!licenseForm.license_number?.trim()) {
      setLicenseError('License number is required.');
      return;
    }
    setLicenseError('');
    setIsLicenseSubmitting(true);
    try {
      await updateProfile({ license_number: licenseForm.license_number, license_document_url: licenseForm.license_document_url || undefined });
      showToast({ type: 'success', message: 'License info updated.' });
    } catch (err) {
      setLicenseError(err.normalizedMessage || 'Failed to update license info.');
    } finally {
      setIsLicenseSubmitting(false);
    }
  }

  async function handleLicenseDocumentChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLicense(true);
    try {
      const res = await uploadLicenseDocument(file);
      setLicenseForm((c) => ({ ...c, license_document_url: res.image_url }));
      await hydrateProfile();
      showToast({ type: 'success', message: 'License document uploaded.' });
    } catch (err) {
      setLicenseError(err.normalizedMessage || 'Failed to upload document.');
    } finally {
      setIsUploadingLicense(false);
      e.target.value = '';
    }
  }

  if (isLoading) return <Loader label="Loading profile..." fullScreen />;

  let statusText = 'Not Submitted';
  let badgeColor = 'bg-slate-100 text-slate-700';
  if (user?.license_verified) {
    statusText = 'Verified';
    badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  } else if (user?.license_document_url) {
    statusText = 'Under Review';
    badgeColor = 'bg-amber-50 text-amber-700 border border-amber-200';
  }

  return (
    <DashboardShell
      title="Update Profile"
      subtitle="Manage your personal details, contact information and security settings."
      links={CUSTOMER_LINKS}
    >
      <div className="max-w-4xl space-y-8">

        {/* Row 1: Personal Details + Password side by side */}
        <div className="grid gap-8 lg:grid-cols-2">

        {/* Personal details */}
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

        </div>{/* end row-1 grid */}

        {/* Driving License — full width */}
        <div className="glass-panel p-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Verification</p>
              <h2 className="mt-2 font-heading text-3xl text-ink">Driving License</h2>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${badgeColor}`}>
              {statusText}
            </span>
          </div>
          <form onSubmit={handleLicenseSubmit} className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">License number</label>
              <input
                value={licenseForm.license_number}
                onChange={(e) => setLicenseForm((c) => ({ ...c, license_number: e.target.value }))}
                placeholder="e.g. DL-12345678"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">License document</label>
              <div className="flex items-center gap-4">
                {licenseForm.license_document_url ? (
                  <a href={licenseForm.license_document_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-brand hover:bg-slate-200">
                    View uploaded document
                  </a>
                ) : (
                  <span className="text-sm text-slate-400">No document uploaded yet.</span>
                )}
                <label className="cursor-pointer rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                  {isUploadingLicense ? 'Uploading...' : 'Upload document'}
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleLicenseDocumentChange} disabled={isUploadingLicense} />
                </label>
              </div>
            </div>
            {licenseError ? <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{licenseError}</div> : null}
            <button type="submit" disabled={isLicenseSubmitting} className="rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
              {isLicenseSubmitting ? 'Saving...' : 'Save license info'}
            </button>
          </form>
        </div>

      </div>
    </DashboardShell>
  );
}
