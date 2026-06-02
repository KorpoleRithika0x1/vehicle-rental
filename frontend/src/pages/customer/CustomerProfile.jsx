import DashboardShell from '../../components/dashboard/DashboardShell';
import Profile from '../Profile';
import { CUSTOMER_LINKS } from '../dashboard/CustomerDashboard';

export default function CustomerProfile() {
  return (
    <DashboardShell title="Profile" subtitle="Manage your account details." links={CUSTOMER_LINKS}>
      <Profile embedded />
    </DashboardShell>
  );
}
