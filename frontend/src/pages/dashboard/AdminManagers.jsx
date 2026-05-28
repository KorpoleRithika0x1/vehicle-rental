import { Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { fetchUsers, updateUserRole, updateUserStatus } from '../../api/users';
import { register } from '../../api/auth';
import Loader from '../../components/common/Loader';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { useAuth } from '../../hooks/useAuth';
import { useUiStore } from '../../store/uiStore';

const initialForm = { name: '', email: '', password: '', phone_number: '' };

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

export default function AdminManagers() {
  const { user: currentUser } = useAuth();
  const [managers, setManagers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  async function loadManagers() {
    setIsLoading(true);
    try {
      const response = await fetchUsers({ page: 1, page_size: 50 });
      const filtered = (response.items || []).filter((item) => item.role === 'vehicle_manager' && item.id !== currentUser?.id);
      setManagers(filtered);
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
      ]}
    >
      {showAddModal ? <AddManagerModal onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); loadManagers(); }} /> : null}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl text-ink">Manage Managers</h1>
          <p className="mt-1 text-sm text-slate-500">View and control only vehicle manager accounts.</p>
        </div>
        <button type="button" onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
          <Plus className="h-4 w-4" />
          Add Manager
        </button>
      </div>
      <div className="space-y-4">
        {managers.map((manager) => (
          <div key={manager.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl text-ink">{manager.name}</h2>
                <p className="text-sm text-slate-500">{manager.email}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.25em] text-brand">{manager.role}</p>
                <p className={`mt-1 text-xs font-semibold ${manager.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>{manager.is_active ? 'Active' : 'Blocked'}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <select value={manager.role} onChange={(event) => handleRoleChange(manager.id, event.target.value)} className="rounded-full border border-slate-200 px-4 py-2 text-sm">
                  {['vehicle_manager', 'customer', 'admin'].map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleStatusToggle(manager)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${manager.is_active ? 'border border-rose-200 text-rose-600' : 'border border-emerald-200 text-emerald-600'}`}
                >
                  {manager.is_active ? 'Block' : 'Unblock'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
