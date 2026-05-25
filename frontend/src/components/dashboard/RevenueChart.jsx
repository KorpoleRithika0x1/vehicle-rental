import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { formatCurrency } from '../../utils/formatCurrency';

export default function RevenueChart({ data = [] }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
      <div className="mb-6">
        <h3 className="font-heading text-2xl text-ink">Revenue Trend</h3>
        <p className="text-sm text-slate-500">Recent booking revenue based on non-cancelled operational states.</p>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#16213e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#16213e" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
            <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis tickFormatter={(value) => `$${value}`} tick={{ fill: '#64748b', fontSize: 12 }} />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Area type="monotone" dataKey="revenue" stroke="#16213e" fill="url(#revenueGradient)" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
