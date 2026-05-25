import { ChevronLeft, ChevronRight } from 'lucide-react';

import { usePagination } from '../../hooks/usePagination';

export default function Pagination({ page, totalPages, onPageChange }) {
  const pages = usePagination(page, totalPages);

  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(page - 1, 1))}
        disabled={page === 1}
        className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPageChange(item)}
          className={`h-10 w-10 rounded-full text-sm font-semibold transition ${
            item === page ? 'bg-brand text-white' : 'border border-slate-200 text-slate-700 hover:border-brand hover:text-brand'
          }`}
        >
          {item}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(page + 1, totalPages))}
        disabled={page === totalPages}
        className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
