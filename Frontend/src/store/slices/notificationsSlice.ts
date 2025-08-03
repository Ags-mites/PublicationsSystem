import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { NotificationItem } from '../../types/api';

interface NotificationsState {
  notifications: NotificationItem[];
  unreadCount: number;
  isConnected: boolean;
  activeToasts: string[]; // IDs of currently displayed toast notifications
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  isConnected: false,
  activeToasts: [],
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<NotificationItem[]>) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(n => !n.readAt).length;
    },

    addNotification: (state, action: PayloadAction<NotificationItem>) => {
      const existingIndex = state.notifications.findIndex(n => n.id === action.payload.id);
      
      if (existingIndex >= 0) {
        // Update existing notification
        state.notifications[existingIndex] = action.payload;
      } else {
        // Add new notification to the beginning of the list
        state.notifications.unshift(action.payload);
      }

      // Update unread count
      state.unreadCount = state.notifications.filter(n => !n.readAt).length;
    },

    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.readAt) {
        notification.readAt = new Date().toISOString();
        notification.status = 'READ' as any;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },

    markAllAsRead: (state) => {
      const now = new Date().toISOString();
      state.notifications.forEach(notification => {
        if (!notification.readAt) {
          notification.readAt = now;
          notification.status = 'READ' as any;
        }
      });
      state.unreadCount = 0;
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex(n => n.id === action.payload);
      if (index >= 0) {
        const notification = state.notifications[index];
        if (!notification.readAt) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(index, 1);
      }
    },

    clearReadNotifications: (state) => {
      state.notifications = state.notifications.filter(n => !n.readAt);
    },

    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },

    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },

    addActiveToast: (state, action: PayloadAction<string>) => {
      if (!state.activeToasts.includes(action.payload)) {
        state.activeToasts.push(action.payload);
      }
    },

    removeActiveToast: (state, action: PayloadAction<string>) => {
      state.activeToasts = state.activeToasts.filter(id => id !== action.payload);
    },

    clearActiveToasts: (state) => {
      state.activeToasts = [];
    },
  },
});

export const {
  setNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearReadNotifications,
  setUnreadCount,
  setConnectionStatus,
  addActiveToast,
  removeActiveToast,
  clearActiveToasts,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;

// Selectors
export const selectNotifications = (state: { notifications: NotificationsState }) => 
  state.notifications.notifications;

export const selectUnreadCount = (state: { notifications: NotificationsState }) =>
  state.notifications.unreadCount;

export const selectUnreadNotifications = (state: { notifications: NotificationsState }) =>
  state.notifications.notifications.filter(n => !n.readAt);

export const selectIsConnected = (state: { notifications: NotificationsState }) =>
  state.notifications.isConnected;

export const selectActiveToasts = (state: { notifications: NotificationsState }) =>
  state.notifications.activeToasts;

export const selectNotificationById = (id: string) => (state: { notifications: NotificationsState }) =>
  state.notifications.notifications.find(n => n.id === id);

export const selectRecentNotifications = (limit: number = 5) => (state: { notifications: NotificationsState }) =>
  state.notifications.notifications
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);