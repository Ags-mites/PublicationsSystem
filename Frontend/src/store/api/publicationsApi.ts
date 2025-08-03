import { baseApi } from './baseApi';
import type {
  PublicationListItem,
  PublicationDetail,
  PublicationsQueryParams,
  CreatePublicationRequest,
  UpdatePublicationRequest,
  SubmitForReviewRequest,
  ApprovePublicationRequest,
  PublishPublicationRequest,
  RequestChangesRequest,
  StatusHistoryItem,
  ReviewSummary,
  ReviewDetail,
  CreateReviewRequest,
  CompleteReviewRequest,
  ApiResponse,
} from '../../types/api';

export const publicationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get my publications
    getMyPublications: builder.query<PublicationListItem[], PublicationsQueryParams>({
      query: (params) => ({
        url: 'publications',
        params: {
          ...params,
          page: params.page || 1,
          limit: params.limit || 20,
        },
      }),
      providesTags: ['Publication'],
      transformResponse: (response: ApiResponse<PublicationListItem[]>) => response.data,
    }),

    // Get publication detail
    getPublicationDetail: builder.query<PublicationDetail, string>({
      query: (id) => `publications/${id}`,
      providesTags: (result, error, id) => [{ type: 'Publication', id }],
      transformResponse: (response: ApiResponse<PublicationDetail>) => response.data,
    }),

    // Create publication
    createPublication: builder.mutation<PublicationDetail, CreatePublicationRequest>({
      query: (publicationData) => ({
        url: 'publications',
        method: 'POST',
        body: publicationData,
      }),
      invalidatesTags: ['Publication'],
      transformResponse: (response: ApiResponse<PublicationDetail>) => response.data,
    }),

    // Update publication (only in DRAFT status)
    updatePublication: builder.mutation<
      PublicationDetail,
      { id: string; data: UpdatePublicationRequest }
    >({
      query: ({ id, data }) => ({
        url: `publications/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Publication', id }],
      transformResponse: (response: ApiResponse<PublicationDetail>) => response.data,
    }),

    // Submit for review
    submitForReview: builder.mutation<
      void,
      { id: string; data: SubmitForReviewRequest }
    >({
      query: ({ id, data }) => ({
        url: `publications/${id}/submit-for-review`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Publication', id }],
      transformResponse: (response: ApiResponse<void>) => response.data,
    }),

    // Get publication reviews
    getPublicationReviews: builder.query<ReviewSummary[], string>({
      query: (id) => `publications/${id}/reviews`,
      providesTags: (result, error, id) => [
        { type: 'Review', id },
        { type: 'Publication', id },
      ],
      transformResponse: (response: ApiResponse<ReviewSummary[]>) => response.data,
    }),

    // Create review (REVIEWER role)
    createReview: builder.mutation<
      void,
      { publicationId: string; data: CreateReviewRequest }
    >({
      query: ({ publicationId, data }) => ({
        url: `publications/${publicationId}/reviews`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Review', 'Publication'],
      transformResponse: (response: ApiResponse<void>) => response.data,
    }),

    // Approve publication (EDITOR/ADMIN roles)
    approvePublication: builder.mutation<
      void,
      { id: string; data: ApprovePublicationRequest }
    >({
      query: ({ id, data }) => ({
        url: `publications/${id}/approve`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Publication', id }],
      transformResponse: (response: ApiResponse<void>) => response.data,
    }),

    // Publish publication (EDITOR/ADMIN roles)
    publishPublication: builder.mutation<
      void,
      { id: string; data: PublishPublicationRequest }
    >({
      query: ({ id, data }) => ({
        url: `publications/${id}/publish`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Publication', id }],
      transformResponse: (response: ApiResponse<void>) => response.data,
    }),

    // Request changes (EDITOR/ADMIN roles)
    requestChanges: builder.mutation<
      void,
      { id: string; data: RequestChangesRequest }
    >({
      query: ({ id, data }) => ({
        url: `publications/${id}/request-changes`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Publication', id }],
      transformResponse: (response: ApiResponse<void>) => response.data,
    }),

    // Get publication status history
    getPublicationHistory: builder.query<StatusHistoryItem[], string>({
      query: (id) => `publications/${id}/history`,
      providesTags: (result, error, id) => [{ type: 'Publication', id }],
      transformResponse: (response: ApiResponse<StatusHistoryItem[]>) => response.data,
    }),

    // Get my reviews
    getMyReviews: builder.query<ReviewSummary[], void>({
      query: () => 'reviews',
      providesTags: ['Review'],
      transformResponse: (response: ApiResponse<ReviewSummary[]>) => response.data,
    }),

    // Get review detail
    getReviewDetail: builder.query<ReviewDetail, string>({
      query: (id) => `reviews/${id}/detail`,
      providesTags: (result, error, id) => [{ type: 'Review', id }],
      transformResponse: (response: ApiResponse<ReviewDetail>) => response.data,
    }),

    // Complete review
    completeReview: builder.mutation<
      void,
      { id: string; data: CompleteReviewRequest }
    >({
      query: ({ id, data }) => ({
        url: `reviews/${id}/complete`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Review', 'Publication'],
      transformResponse: (response: ApiResponse<void>) => response.data,
    }),
  }),
});

export const {
  useGetMyPublicationsQuery,
  useGetPublicationDetailQuery,
  useCreatePublicationMutation,
  useUpdatePublicationMutation,
  useSubmitForReviewMutation,
  useGetPublicationReviewsQuery,
  useCreateReviewMutation,
  useApprovePublicationMutation,
  usePublishPublicationMutation,
  useRequestChangesMutation,
  useGetPublicationHistoryQuery,
  useGetMyReviewsQuery,
  useGetReviewDetailQuery,
  useCompleteReviewMutation,
} = publicationsApi;