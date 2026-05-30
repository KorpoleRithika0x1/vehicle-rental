import { apiClient } from './client';

export async function createPaymentIntent(payload) {
  // payload: { vehicle_id, pickup_date, return_date }
  const { data } = await apiClient.post('/payments/create-intent', payload);
  return data; // { client_secret, amount, currency, payment_intent_id }
}

export async function confirmPayment(payload) {
  // payload: { payment_intent_id, vehicle_id, pickup_date, return_date }
  const { data } = await apiClient.post('/payments/confirm', payload);
  return data; // { booking_id, status, total_amount, message }
}
