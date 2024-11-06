// redux/notificationsSlice.js
import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
  name: 'notifications',
  initialState: {
    unreadCount: 0,
    messages: [], // Store messages here
  },
  reducers: {
    setNotifications: (state, action) => {
      state.messages = action.payload;
      state.unreadCount = action.payload.filter(msg => !msg.seen).length; // Count unseen messages
    },
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },
    decrementUnreadCount: (state) => {
      if (state.unreadCount > 0) {
        state.unreadCount -= 1;
      }
    },
    markMessageAsSeen: (state, action) => {
      const messageIndex = state.messages.findIndex(msg => msg._id === action.payload);
      if (messageIndex !== -1) {
        state.messages[messageIndex].seen = true;
        state.unreadCount = state.messages.filter(msg => !msg.seen).length; // Update count
      }
    },
  },
});

export const { setNotifications, incrementUnreadCount, decrementUnreadCount, markMessageAsSeen } = chatSlice.actions;

export default chatSlice.reducer;