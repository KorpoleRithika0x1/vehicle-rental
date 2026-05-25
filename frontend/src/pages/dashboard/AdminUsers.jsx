import { useEffect, useState } from 'react';

import { deactivateUser, fetchUsers, updateUserRole } from '../../api/users';
import Loader from '../../components/common/Loader';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadUsers() {
    setIsLoading(true);
    try {
      const response = await fetchUsers({ page: 1, page_size: 50 });
      setUsers(response.items);
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

  async function handleDeactivate(userId) {
    await deactivateUser(userId);
    await loadUsers();
  }

  if (isLoading) {
    return <Loader label="Loading users..." fullScreen />;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">User Management</p>
        <h1 className="mt-4 font-heading text-5xl text-ink">Adjust roles and platform access.</h1>
      </div>
      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl text-ink">{user.name}</h2>
                <p className="text-sm text-slate-500">{user.email}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.25em] text-brand">{user.role}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <select value={user.role} onChange={(event) => handleRoleChange(user.id, event.target.value)} className="rounded-full border border-slate-200 px-4 py-2 text-sm">
                  {['customer', 'vehicle_manager', 'admin'].map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => handleDeactivate(user.id)} className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600">
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
