import { useBookingStore } from '../store/bookingStore';

export function useBooking() {
  return useBookingStore();
}
