import { useMemo } from 'react';

export function usePagination(page, totalPages) {
  return useMemo(() => {
    const pages = [];
    const start = Math.max(page - 2, 1);
    const end = Math.min(start + 4, totalPages);
    for (let current = start; current <= end; current += 1) {
      pages.push(current);
    }
    return pages;
  }, [page, totalPages]);
}
