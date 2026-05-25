import clsx from 'clsx';

export default function Badge({ children, tone = 'default' }) {
  const styles = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-700',
    danger: 'bg-rose-100 text-rose-700',
    warning: 'bg-amber-100 text-amber-700',
    brand: 'bg-brand/10 text-brand',
  };

  return (
    <span className={clsx('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', styles[tone] || styles.default)}>
      {children}
    </span>
  );
}
