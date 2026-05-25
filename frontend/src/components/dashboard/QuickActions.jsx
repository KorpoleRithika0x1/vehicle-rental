import { Link } from 'react-router-dom';

export default function QuickActions({ actions = [] }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
      <h3 className="font-heading text-2xl text-ink">Quick Actions</h3>
      <div className="mt-5 grid gap-3">
        {actions.map((action) =>
          action.onClick ? (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand"
            >
              {action.label}
            </button>
          ) : (
            <Link
              key={action.label}
              to={action.to}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand"
            >
              {action.label}
            </Link>
          )
        )}
      </div>
    </div>
  );
}
