import { Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { fetchUsers, updateUserRole, updateUserStatus } from '../../api/users';
import { fetchManagersWithRegions, grantRegion, revokeRegion } from '../../api/regions';
import { register } from '../../api/auth';
import Loader from '../../components/common/Loader';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { useAuth } from '../../hooks/useAuth';
import { useUiStore } from '../../store/uiStore';
import { CITIES } from '../../utils/cities';

const initialForm = { name: '', email: '', password: '', phone_number: '' };

const CITY_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-indigo-100 text-indigo-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700',
];

function getCityColor(city) {
  const index = CITIES.indexOf(city);
  return CITY_COLORS[index % CITY_COLORS.length];
}

function AddManagerModal({ onClose, onSuccess }) {
  const [form, setForm] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const showToast = useUiStore((state) => state.showToast);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      const data = await register(form);
      await updateUserRole(data.user.id, { role: 'vehicle_manager' });
      showToast({ type: 'success', message: 'Manager added successfully.' });
      onSuccess();
    } catch (err) {
      setError(err?.normalizedMessage || 'Failed to add manager.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-ink">Add New Manager</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-3">
          <input required value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} placeholder="Full name" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
          <input required type="email" value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} placeholder="Email address" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
          <input required type="password" value={form.password} onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))} placeholder="Password" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
          <input value={form.phone_number} onChange={(e) => setForm((c) => ({ ...c, phone_number: e.target.value }))} placeholder="Phone number (optional)" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
          {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={isSaving} className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {isSaving ? 'Adding...' : 'Add Manager'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RegionAssignModal({ managerId, existingRegions, onClose, onSuccess }) {
  const [selectedCity, setSelectedCity] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const showToast = useUiStore((state) => state.showToast);
  const availableCities = CITIES.filter((city) => !existingRegions.includes(city));

  async function handleGrant() {
    if (!selectedCity) return;
    setIsSaving(true);
    try {
      await grantRegion(managerId, selectedCity);
      showToast({ type: 'success', message: `Granted ${selectedCity} successfully.` });
      onSuccess();
    } catch (err) {
      showToast({ type: 'error', message: err?.normalizedMessage || 'Failed to grant region.' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-ink">Assign Region</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {availableCities.length === 0 ? (
            <p className="text-sm text-slate-500">All regions are already assigned to this manager.</p>
          ) : (
            <>
              <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none">
                <option value="">Select city</option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="button" onClick={handleGrant} disabled={!selectedCity || isSaving} className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {isSaving ? 'Granting...' : 'Grant Region'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminManagers() {
  const { user: currentUser } = useAuth();
  const [managers, setManagers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(null);
  const showToast = useUiStore((state) => state.showToast);

  async function loadManagers() {
    setIsLoading(true);
    try {
      const data = await fetchManagersWithRegions();
      setManagers(data.filter((item) => item.id !== currentUser?.id));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadManagers();
  }, []);

  async function handleRoleChange(userId, role) {
    await updateUserRole(userId, { role });
    await loadManagers();
  }

  async function handleStatusToggle(user) {
    await updateUserStatus(user.id, { is_active: !user.is_active });
    await loadManagers();
  }

  async function handleRevokeRegion(managerId, city) {
    try {
      await revokeRegion(managerId, city);
      showToast({ type: 'success', message: `Revoked ${city} successfully.` });
      await loadManagers();
    } catch (err) {
      showToast({ type: 'error', message: err?.normalizedMessage || 'Failed to revoke region.' });
    }
  }

  if (isLoading) {
    return <Loader label="Loading managers..." fullScreen />;
  }

  return (
    <DashboardShell
      title=""
      subtitle=""
      links={[
        { label: 'Dashboard', to: '/dashboard/admin', end: true },
        { label: 'Manage Users', to: '/dashboard/admin/users' },
        { label: 'Manage Managers', to: '/dashboard/admin/managers' },
        { label: 'License Verifications', to: '/dashboard/admin/licenses' },
        { label: 'Reports', to: '/dashboard/admin/reports' },
        { label: 'Reviews', to: '/dashboard/admin/reviews' },
      ]}
    >
      {showAddModal ? <AddManagerModal onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); loadManagers(); }} /> : null}
      {showRegionModal ? <RegionAssignModal managerId={showRegionModal.id} existingRegions={showRegionModal.regions} onClose={() => setShowRegionModal(null)} onSuccess={() => { setShowRegionModal(null); loadManagers(); }} /> : null}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl text-ink">Manage Managers</h1>
          <p className="mt-1 text-sm text-slate-500">Control manager accounts and assign regional access.</p>
        </div>
        <button type="button" onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
          <Plus className="h-4 w-4" />
          Add Manager
        </button>
      </div>
      <div className="space-y-4">
        {managers.map((manager) => (
          <div key={manager.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="font-heading text-2xl text-ink">{manager.name}</h2>
                <p className="text-sm text-slate-500">{manager.email}</p>
                <div className="mt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-600">Assigned Regions:</p>
                  <div className="flex flex-wrap gap-2">
                    {manager.regions.length === 0 ? (
                      <span className="text-xs text-slate-400">No regions assigned</span>
                    ) : (
                      manager.regions.map((city) => (
                        <span key={city} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${getCityColor(city)}`}>
                          {city}
                          <button type="button" onClick={() => handleRevokeRegion(manager.id, city)} className="hover:opacity-70">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setShowRegionModal({ id: manager.id, regions: manager.regions })}
                  className="rounded-full border border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-brand hover:text-white"
                >
                  Assign Region
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
