// Importing the necessary functions from @reduxjs/toolkit
import { createSlice } from '@reduxjs/toolkit';

// Initial state for the notifications slice
const initialState = {
  notifications: [],
  unreadCount: 0,
};

// Creating the notifications slice
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications(state, action) {
      // Setting notifications from the payload
      state.notifications = action.payload;
      // Updating unread count
      state.unreadCount = action.payload.filter(
        (notification) => !notification.isRead
      ).length;
    },
    markNotificationAsRead(state, action) {
      const notificationId = action.payload;
      // Finding the specific notification by its ID
      const notification = state.notifications.find(
        (n) => n._id === notificationId
      );
      if (notification) {
        notification.isRead = true;
        // Recalculating the unread count
        state.unreadCount = state.notifications.filter(
          (n) => !n.isRead
        ).length;
      }
    },
    
  },
});

// Exporting actions and reducer
export const { setNotifications, markNotificationAsRead } = notificationsSlice.actions;
export default notificationsSlice.reducer;
