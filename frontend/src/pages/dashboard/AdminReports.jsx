import { useState } from 'react';
import { ArrowLeft, Building2, IndianRupee, Users, Car, Star } from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell,
  Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from 'recharts';

import { fetchRegionReport } from '../../api/reports';
import DashboardShell from '../../components/dashboard/DashboardShell';
import Loader from '../../components/common/Loader';

const ADMIN_LINKS = [
  { label: 'Dashboard',             to: '/dashboard/admin',          end: true },
  { label: 'Manage Users',          to: '/dashboard/admin/users' },
  { label: 'Manage Managers',       to: '/dashboard/admin/managers' },
  { label: 'License Verifications', to: '/dashboard/admin/licenses' },
  { label: 'Reports',               to: '/dashboard/admin/reports' },
  { label: 'Reviews',               to: '/dashboard/admin/reviews' },
];

const CITIES = [
  { name: 'Mumbai',    image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80', landmark: 'Gateway of India' },
  { name: 'Bangalore', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80', landmark: 'Vidhana Soudha' },
  { name: 'Delhi',     image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80', landmark: 'India Gate' },
  { name: 'Chennai',   image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80', landmark: 'Marina Beach' },
  { name: 'Hyderabad', image: 'https://images.unsplash.com/photo-1575470154163-5c7f0cbee3b4?auto=format&fit=crop&w=600&q=80', landmark: 'Charminar' },
  { name: 'Goa',       image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80', landmark: 'Baga Beach' },
  { name: 'Manali',    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80', landmark: 'Rohtang Pass' },
  { name: 'Kochi',     image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80', landmark: 'Chinese Fishing Nets' },
  { name: 'Kolkata',   image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80', landmark: 'Howrah Bridge' },
  { name: 'Guwahati',  image: 'https://images.unsplash.com/photo-1626362372000-5e5d3f5e4d5e?auto=format&fit=crop&w=600&q=80', landmark: 'Kamakhya Temple' },
];

const PIE_COLORS = { approved: '#0ea5e9', completed: '#10b981', cancelled: '#f43f5e', pending: '#f59e0b', active: '#6366f1' };
const BAR_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function StatBox({ icon: Icon, label, value, accent = 'bg-brand' }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent} text-white`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="font-bold text-ink">{value}</p>
      </div>
    </div>
  );
}

export default function AdminReports() {
  const [selectedCity, setSelectedCity] = useState(null);
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleCityClick(city) {
    setSelectedCity(city);
    setIsLoading(true);
    try {
      const data = await fetchRegionReport(city);
      setReport(data);
    } finally {
      setIsLoading(false);
    }
  }

  if (selectedCity) {
    return (
      <DashboardShell title={`${selectedCity} Region Report`} subtitle="Detailed statistics for this region." links={ADMIN_LINKS}>
        <button
          type="button"
          onClick={() => { setSelectedCity(null); setReport(null); }}
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to all regions
        </button>

        {isLoading ? (
          <Loader label="Loading region data..." />
        ) : report ? (
          <div className="space-y-6">
            {/* Stat boxes */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatBox icon={Building2} label="Total Bookings" value={report.total_bookings} />
              <StatBox icon={Users}     label="Unique Customers" value={report.unique_customers} accent="bg-sky-500" />
              <StatBox icon={IndianRupee} label="Total Revenue" value={`₹${Number(report.total_revenue).toLocaleString('en-IN')}`} accent="bg-emerald-500" />
              <StatBox icon={Car}       label="Vehicles in Region" value={report.total_vehicles} accent="bg-amber-500" />
              <StatBox icon={Star}      label="Avg Rating" value={report.avg_rating ? `${report.avg_rating} / 5` : 'N/A'} accent="bg-violet-500" />
            </div>

            {/* Charts */}
            <div className="grid gap-6 xl:grid-cols-2">
              {/* Revenue trend */}
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
                <h3 className="mb-4 font-heading text-xl text-ink">Revenue Trend (Last 6 Months)</h3>
                {report.revenue_trend?.length ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={report.revenue_trend} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} />
                      <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                        {report.revenue_trend.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="py-10 text-center text-sm text-slate-400">No revenue data yet</p>}
              </div>

              {/* Bookings trend */}
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
                <h3 className="mb-4 font-heading text-xl text-ink">Bookings Trend (Last 6 Months)</h3>
                {report.bookings_trend?.length ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={report.bookings_trend} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <Tooltip formatter={(v) => [v, 'Bookings']} />
                      <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <p className="py-10 text-center text-sm text-slate-400">No bookings data yet</p>}
              </div>
            </div>

            {/* Booking status pie */}
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
              <h3 className="mb-4 font-heading text-xl text-ink">Booking Status Breakdown</h3>
              {report.status_breakdown?.length ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={report.status_breakdown} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}>
                      {report.status_breakdown.map((entry, i) => (
                        <Cell key={i} fill={PIE_COLORS[entry.status] || BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, name) => [v, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="py-10 text-center text-sm text-slate-400">No status data yet</p>}
            </div>
          </div>
        ) : null}
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Region Reports" subtitle="Click on a region to view detailed analytics." links={ADMIN_LINKS}>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {CITIES.map((city) => (
          <button
            key={city.name}
            type="button"
            onClick={() => handleCityClick(city.name)}
            className="group overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="relative h-40 overflow-hidden">
              <img
                src={city.image}
                alt={city.name}
                className="h-full w-full object-cover transition group-hover:scale-105"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=600&q=80'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-4 text-left">
                <p className="text-lg font-bold text-white">{city.name}</p>
                <p className="text-xs text-white/80">{city.landmark}</p>
              </div>
            </div>
            <div className="px-4 py-3 text-left">
              <p className="text-xs font-semibold text-brand">View Region Report →</p>
            </div>
          </button>
        ))}
      </div>
    </DashboardShell>
  );
}
