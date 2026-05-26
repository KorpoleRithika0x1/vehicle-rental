import { useEffect, useState } from 'react';

import { fetchUsers, updateUserRole, updateUserStatus } from '../../api/users';
import Loader from '../../components/common/Loader';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { useAuth } from '../../hooks/useAuth';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadUsers() {
    setIsLoading(true);
    try {
      const response = await fetchUsers({ page: 1, page_size: 50 });
      const filtered = (response.items || []).filter((item) => item.role === 'customer' && item.id !== currentUser?.id);
      setUsers(filtered);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleRoleChange(userId, role) {
    await updateUserRole(userId, { role });
    await loadUsers();
  }

  async function handleStatusToggle(user) {
    await updateUserStatus(user.id, { is_active: !user.is_active });
    await loadUsers();
  }

  if (isLoading) {
    return <Loader label="Loading users..." fullScreen />;
  }

  return (
    <DashboardShell
      title="Manage Users"
      subtitle="Manage users, managers, and account access from one place."
      links={[
        { label: 'Dashboard', to: '/dashboard/admin', end: true },
        { label: 'Manage Users', to: '/dashboard/admin/users' },
        { label: 'Manage Managers', to: '/dashboard/admin/managers' },
      ]}
    >
      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl text-ink">{user.name}</h2>
                <p className="text-sm text-slate-500">{user.email}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.25em] text-brand">{user.role}</p>
                <p className={`mt-1 text-xs font-semibold ${user.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>{user.is_active ? 'Active' : 'Blocked'}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <select value={user.role} onChange={(event) => handleRoleChange(user.id, event.target.value)} className="rounded-full border border-slate-200 px-4 py-2 text-sm">
                  {['customer', 'vehicle_manager', 'admin'].map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleStatusToggle(user)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${user.is_active ? 'border border-rose-200 text-rose-600' : 'border border-emerald-200 text-emerald-600'}`}
                >
                  {user.is_active ? 'Block' : 'Unblock'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
