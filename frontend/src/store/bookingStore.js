import { create } from 'zustand';

import {
  approveBookingRequest,
  cancelBookingRequest,
  completeBookingRequest,
  createBooking as createBookingRequest,
  fetchBooking,
  fetchBookings,
  rejectBookingRequest,
} from '../api/bookings';
import { useUiStore } from './uiStore';

export const useBookingStore = create((set, get) => ({
  bookings: [],
  activeBooking: null,
  pagination: { total: 0, page: 1, page_size: 12, total_pages: 1 },
  createBooking: async (payload) => {
    try {
      const booking = await createBookingRequest(payload);
      set((state) => ({ bookings: [booking, ...state.bookings], activeBooking: booking }));
      useUiStore.getState().showToast({ type: 'success', message: 'Booking request submitted.' });
      return booking;
    } catch (error) {
      if (error.statusCode === 409) {
        useUiStore.getState().showToast({ type: 'error', message: error.normalizedMessage });
      }
      throw error;
    }
  },
  fetchHistory: async (params = {}) => {
    const data = await fetchBookings(params);
    set({
      bookings: data.items,
      pagination: {
        total: data.total,
        page: data.page,
        page_size: data.page_size,
        total_pages: data.total_pages,
      },
    });
    return data;
  },
  fetchBooking: async (bookingId) => {
    const booking = await fetchBooking(bookingId);
    set({ activeBooking: booking });
    return booking;
  },
  cancelBooking: async (bookingId) => {
    const previous = get().bookings;
    set((state) => ({
      bookings: state.bookings.map((booking) =>
        booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking
      ),
    }));
    try {
      const updatedBooking = await cancelBookingRequest(bookingId);
      set((state) => ({
        bookings: state.bookings.map((booking) => (booking.id === bookingId ? updatedBooking : booking)),
      }));
      useUiStore.getState().showToast({ type: 'success', message: 'Booking cancelled.' });
      return updatedBooking;
    } catch (error) {
      set({ bookings: previous });
      throw error;
    }
  },
  approveBooking: async (bookingId) => {
    const updatedBooking = await approveBookingRequest(bookingId);
    set((state) => ({
      bookings: state.bookings.map((booking) => (booking.id === bookingId ? updatedBooking : booking)),
    }));
    return updatedBooking;
  },
  rejectBooking: async (bookingId) => {
    const updatedBooking = await rejectBookingRequest(bookingId);
    set((state) => ({
      bookings: state.bookings.map((booking) => (booking.id === bookingId ? updatedBooking : booking)),
    }));
    return updatedBooking;
  },
  completeBooking: async (bookingId) => {
    const updatedBooking = await completeBookingRequest(bookingId);
    set((state) => ({
      bookings: state.bookings.map((booking) => (booking.id === bookingId ? updatedBooking : booking)),
    }));
    return updatedBooking;
  },
}));
