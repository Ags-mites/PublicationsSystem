import { baseApi } from './baseApi';
import type {
  NotificationItem,
  NotificationsQueryParams,
  NotificationSubscription,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  NotificationPreferences,
  UpdatePreferencesRequest,
  ApiResponse,
} from '../../types/api';

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get notifications
    getNotifications: builder.query<NotificationItem[], NotificationsQueryParams>({
      query: (params) => ({
        url: 'notifications',
        params: {
          ...params,
          page: params.page || 1,
          limit: params.limit || 20,
        },
      }),
      providesTags: ['Notification'],
      transformResponse: (response: ApiResponse<NotificationItem[]>) => response.data,
    }),

    // Get unread notifications count
    getUnreadCount: builder.query<number, void>({
      query: () => 'notifications/unread-count',
      providesTags: ['Notification'],
      transformResponse: (response: ApiResponse<{ count: number }>) => response.data.count,
    }),

    // Mark notification as read
    markNotificationAsRead: builder.mutation<void, string>({
      query: (id) => ({
        url: `notifications/${id}/mark-read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
      transformResponse: (response: ApiResponse<void>) => response.data,
    }),

    // Mark all notifications as read
    markAllAsRead: builder.mutation<void, void>({
      query: () => ({
        url: 'notifications/mark-all-read',
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
      transformResponse: (response: ApiResponse<void>) => response.data,
    }),

    // Delete notification
    deleteNotification: builder.mutation<void, string>({
      query: (id) => ({
        url: `notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
      transformResponse: (response: ApiResponse<void>) => response.data,
    }),

    // Clear all read notifications
    clearAllRead: builder.mutation<void, void>({
      query: () => ({
        url: 'notifications/clear-read',
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
      transformResponse: (response: ApiResponse<void>) => response.data,
    }),

    // Get notification subscriptions
    getSubscriptions: builder.query<NotificationSubscription[], void>({
      query: () => 'notifications/subscriptions',
      providesTags: ['Notification'],
      transformResponse: (response: ApiResponse<NotificationSubscription[]>) => response.data,
    }),

    // Create subscription
    createSubscription: builder.mutation<NotificationSubscription, CreateSubscriptionRequest>({
      query: (subscriptionData) => ({
        url: 'notifications/subscriptions',
        method: 'POST',
        body: subscriptionData,
      }),
      invalidatesTags: ['Notification'],
      transformResponse: (response: ApiResponse<NotificationSubscription>) => response.data,
    }),

    // Update subscription
    updateSubscription: builder.mutation<
      NotificationSubscription,
      { id: string; data: UpdateSubscriptionRequest }
    >({
      query: ({ id, data }) => ({
        url: `notifications/subscriptions/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Notification'],
      transformResponse: (response: ApiResponse<NotificationSubscription>) => response.data,
    }),

    // Delete subscription
    deleteSubscription: builder.mutation<void, string>({
      query: (id) => ({
        url: `notifications/subscriptions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
      transformResponse: (response: ApiResponse<void>) => response.data,
    }),

    // Get notification preferences
    getPreferences: builder.query<NotificationPreferences, void>({
      query: () => 'notifications/preferences',
      providesTags: ['Notification'],
      transformResponse: (response: ApiResponse<NotificationPreferences>) => response.data,
    }),

    // Update notification preferences
    updatePreferences: builder.mutation<NotificationPreferences, UpdatePreferencesRequest>({
      query: (preferencesData) => ({
        url: 'notifications/preferences',
        method: 'PUT',
        body: preferencesData,
      }),
      invalidatesTags: ['Notification'],
      transformResponse: (response: ApiResponse<NotificationPreferences>) => response.data,
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useClearAllReadMutation,
  useGetSubscriptionsQuery,
  useCreateSubscriptionMutation,
  useUpdateSubscriptionMutation,
  useDeleteSubscriptionMutation,
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
} = notificationsApi;