import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth/authSlice';
import applicationReducer from './applications/applicationSlice';
import incidentReducer from './incidents/incidentSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    applications: applicationReducer,
    incidents: incidentReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore Firebase user object in actions
        ignoredActions: ['auth/setFirebaseUser'],
        ignoredPaths: ['auth.user'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;