import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">404</p>
      <h1 className="mt-4 font-heading text-6xl text-ink">Page not found.</h1>
      <p className="mt-4 text-slate-500">The route you requested doesn’t exist in this rental workspace.</p>
      <Link to="/" className="mt-8 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white">
        Go home
      </Link>
    </div>
  );
}
