import { useEffect, useState } from 'react';
import { fetchUsers, verifyUserLicense } from '../../api/users';
import Loader from '../../components/common/Loader';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { useUiStore } from '../../store/uiStore';

export default function AdminLicenses() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const showToast = useUiStore((state) => state.showToast);

  async function loadPendingLicenses() {
    setIsLoading(true);
    try {
      const response = await fetchUsers({ pending_licenses: true, page: 1, page_size: 100 });
      setUsers(response.items || []);
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to load pending license verifications.' });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPendingLicenses();
  }, []);

  async function handleVerify(userId) {
    try {
      await verifyUserLicense(userId);
      showToast({ type: 'success', message: 'License verified successfully.' });
      await loadPendingLicenses();
    } catch (error) {
      showToast({ type: 'error', message: error?.normalizedMessage || 'Failed to verify license.' });
    }
  }

  if (isLoading) {
    return <Loader label="Loading verifications..." fullScreen />;
  }

  return (
    <DashboardShell
      title="License Verifications"
      subtitle="Review submitted driving licenses and verify customer accounts."
      links={[
        { label: 'Dashboard', to: '/dashboard/admin', end: true },
        { label: 'Manage Users', to: '/dashboard/admin/users' },
        { label: 'Manage Managers', to: '/dashboard/admin/managers' },
        { label: 'License Verifications', to: '/dashboard/admin/licenses' },
      ]}
    >
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-slate-500">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-700">
              <tr>
                <th scope="col" className="px-6 py-4">User</th>
                <th scope="col" className="px-6 py-4">License Number</th>
                <th scope="col" className="px-6 py-4">Document</th>
                <th scope="col" className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 border-t border-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-slate-400">
                    No pending license verifications.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-ink">{user.name}</div>
                      <div className="text-xs text-slate-400">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-700">
                      {user.license_number || user.driving_license_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {user.license_document_url ? (
                        <a
                          href={user.license_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
                        >
                          View Document &rarr;
                        </a>
                      ) : (
                        <span className="text-slate-400">No document</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleVerify(user.id)}
                        className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                      >
                        Verify
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
