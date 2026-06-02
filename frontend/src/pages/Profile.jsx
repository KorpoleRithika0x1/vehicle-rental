import { useEffect, useState } from 'react';

import { uploadProfileImage, uploadLicenseDocument, changePassword } from '../api/auth';
import Loader from '../components/common/Loader';
import { useAuth } from '../hooks/useAuth';
import { validatePhone } from '../utils/validators';
import { useUiStore } from '../store/uiStore';

export default function Profile() {
  const { user, hydrateProfile, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone_number: '', profile_image_url: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const showToast = useUiStore((state) => state.showToast);

  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [licenseForm, setLicenseForm] = useState({ license_number: '', license_document_url: '' });
  const [licenseError, setLicenseError] = useState('');
  const [isLicenseSubmitting, setIsLicenseSubmitting] = useState(false);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function loadProfile() {
      setIsLoading(true);
      try {
        const profile = user || (await hydrateProfile());
        if (!ignore) {
          setForm({
            name: profile.name,
            email: profile.email || '',
            phone_number: profile.phone_number || '',
            profile_image_url: profile.profile_image_url || ''
          });
          setLicenseForm({
            license_number: profile.license_number || profile.driving_license_number || '',
            license_document_url: profile.license_document_url || ''
          });
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
    if (form.phone_number && !validatePhone(form.phone_number)) {
      setError('Phone number format is invalid.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await updateProfile(form);
      showToast({ type: 'success', message: 'Profile updated successfully.' });
    } catch (requestError) {
      setError(requestError.normalizedMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleProfileImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setIsUploadingImage(true);
    try {
      const response = await uploadProfileImage(file);
      setForm((current) => ({ ...current, profile_image_url: response.image_url }));
      await updateProfile({ profile_image_url: response.image_url });
      showToast({ type: 'success', message: 'Profile image updated.' });
    } catch (requestError) {
      setError(requestError.normalizedMessage);
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

  async function handleLicenseSubmit(event) {
    event.preventDefault();
    if (!licenseForm.license_number || !licenseForm.license_number.trim()) {
      setLicenseError('License number is required.');
      return;
    }
    setLicenseError('');
    setIsLicenseSubmitting(true);
    try {
      await updateProfile({
        license_number: licenseForm.license_number,
        license_document_url: licenseForm.license_document_url || undefined,
      });
      showToast({ type: 'success', message: 'License info updated successfully.' });
    } catch (requestError) {
      setLicenseError(requestError.normalizedMessage || 'Failed to update license info.');
    } finally {
      setIsLicenseSubmitting(false);
    }
  }

  async function handleLicenseDocumentChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLicenseError('');
    setIsUploadingLicense(true);
    try {
      const response = await uploadLicenseDocument(file);
      setLicenseForm((current) => ({ ...current, license_document_url: response.image_url }));
      await hydrateProfile();
      showToast({ type: 'success', message: 'License document uploaded.' });
    } catch (requestError) {
      setLicenseError(requestError.normalizedMessage || 'Failed to upload document.');
    } finally {
      setIsUploadingLicense(false);
      event.target.value = '';
    }
  }

  if (isLoading) {
    return <Loader label="Loading profile..." fullScreen />;
  }

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
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8 space-y-8">
      {/* Account Details Card */}
      <div className="glass-panel p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Profile</p>
        <h1 className="mt-4 font-heading text-5xl text-ink">Keep your account details current.</h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
                <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageChange} disabled={isUploadingImage} />
              </label>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">Full name</label>
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">Email address</label>
            <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">Phone number</label>
            <input value={form.phone_number} onChange={(event) => setForm((current) => ({ ...current, phone_number: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none" />
          </div>
          {error ? <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
          <button type="submit" disabled={isSubmitting} className="rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white">
            {isSubmitting ? 'Saving changes...' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Password Change Card */}
      <div className="glass-panel p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Security</p>
        <h2 className="mt-2 font-heading text-3xl text-ink">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">Current password</label>
            <input
              type="password"
              value={passwordForm.current_password}
              onChange={(event) => setPasswordForm((current) => ({ ...current, current_password: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">New password</label>
            <input
              type="password"
              value={passwordForm.new_password}
              onChange={(event) => setPasswordForm((current) => ({ ...current, new_password: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">Confirm new password</label>
            <input
              type="password"
              value={passwordForm.confirm_password}
              onChange={(event) => setPasswordForm((current) => ({ ...current, confirm_password: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          {passwordError ? <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{passwordError}</div> : null}
          <button type="submit" disabled={isChangingPassword} className="rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white">
            {isChangingPassword ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>

      {/* Driving License Card */}
      {user?.role === 'customer' && (
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
                onChange={(event) => setLicenseForm((current) => ({ ...current, license_number: event.target.value }))}
                placeholder="e.g. DL-12345678"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">License document</label>
              <div className="flex items-center gap-4">
                {licenseForm.license_document_url ? (
                  <a
                    href={licenseForm.license_document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-brand hover:bg-slate-200"
                  >
                    View uploaded document
                  </a>
                ) : (
                  <div className="text-sm text-slate-400">No document uploaded yet.</div>
                )}
                <label className="cursor-pointer rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                  {isUploadingLicense ? 'Uploading...' : 'Upload document'}
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleLicenseDocumentChange} disabled={isUploadingLicense} />
                </label>
              </div>
            </div>

            {licenseError ? <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{licenseError}</div> : null}
            <button type="submit" disabled={isLicenseSubmitting} className="rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white">
              {isLicenseSubmitting ? 'Saving...' : 'Save license info'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
