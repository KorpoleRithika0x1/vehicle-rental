import { apiClient } from './client';

export async function submitReview(payload) {
  const { data } = await apiClient.post('/reviews/', payload);
  return data;
}

export async function fetchReviews(params) {
  const { data } = await apiClient.get('/reviews/', { params });
  return data;
}

export async function fetchMyReviewedBookings() {
  const { data } = await apiClient.get('/reviews/my');
  return data; // [{ booking_id }]
}
