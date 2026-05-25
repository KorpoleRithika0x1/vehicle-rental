import Badge from '../common/Badge';
import { BOOKING_STATUS_STYLES } from '../../utils/constants';

export default function BookingStatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${BOOKING_STATUS_STYLES[status] || BOOKING_STATUS_STYLES.pending}`}>
      {status}
    </span>
  );
}
