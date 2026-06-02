import { createApi } from '@reduxjs/toolkit/query/react';

import { apiClient } from './client';

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  notification_type: string;
  reference_id: string | null;
  created_at: string;
};

type NotificationsResponse = {
  notifications: NotificationItem[];
  unread_count: number;
};

const axiosBaseQuery =
  () =>
  async ({ url, method = 'GET', data, params }: { url: string; method?: string; data?: unknown; params?: Record<string, unknown> }) => {
    try {
      const result = await apiClient.request({ url, method, data, params });
      return { data: result.data };
    } catch (axiosError: any) {
      return {
        error: {
          status: axiosError?.response?.status ?? 500,
          data: axiosError?.response?.data ?? axiosError.message,
        },
      };
    }
  };

export const notificationsApi = createApi({
  reducerPath: 'notificationsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Notifications'],
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationsResponse, boolean | void>({
      query: (unreadOnly = false) => ({
        url: '/notifications',
        method: 'GET',
        params: { unread_only: unreadOnly },
      }),
      providesTags: ['Notifications'],
    }),
    markAllRead: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/notifications/mark-read',
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications'],
    }),
  }),
});

export const { useGetNotificationsQuery, useMarkAllReadMutation } = notificationsApi;
