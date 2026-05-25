import { format } from 'date-fns';

export function formatDate(value, pattern = 'dd MMM yyyy') {
  if (!value) return '--';
  return format(new Date(value), pattern);
}

export function formatDateTime(value) {
  if (!value) return '--';
  return format(new Date(value), 'dd MMM yyyy, hh:mm a');
}
