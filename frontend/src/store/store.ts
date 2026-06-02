import { configureStore } from '@reduxjs/toolkit';

import { notificationsApi } from '../api/notificationsApi';

export const store = configureStore({
  reducer: {
    [notificationsApi.reducerPath]: notificationsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(notificationsApi.middleware),
});

