import CountUp from 'react-countup';

export default function StatCard({ icon: Icon, label, value, trend, accent = 'bg-brand' }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent} text-white`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend ? <span className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">{trend}</span> : null}
      </div>
      <p className="mt-6 text-sm text-slate-500">{label}</p>
      <div className="mt-2 font-heading text-4xl text-ink">
        <CountUp end={Number(value || 0)} duration={1.3} separator="," decimals={String(value || '').includes('.') ? 2 : 0} />
      </div>
    </div>
  );
}
