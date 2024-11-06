// Importing the necessary functions from @reduxjs/toolkit
import { configureStore } from '@reduxjs/toolkit';
import notificationsReducer from './notificationsSlice';

// Configuring the Redux store
const store = configureStore({
  reducer: {
    notifications: notificationsReducer,
  },
});

// Exporting the store
export default store;
