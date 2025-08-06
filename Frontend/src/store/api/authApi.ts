import { baseApi } from './baseApi';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshRequest,
  RefreshResponse,
  UpdateProfileRequest,
  UserProfile,
  ApiResponse,
} from '../../types/api';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Login
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
      transformResponse: (response: LoginResponse) => response,
      transformErrorResponse: (response: any) => ({
        status: response.status,
        message: response.data?.message || 'Error en el inicio de sesión',
        errors: response.data?.errors || [],
      }),
    }),

    // Register
    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (userData) => ({
        url: 'auth/register',
        method: 'POST',
        body: userData,
      }),
      transformResponse: (response: RegisterResponse) => response,
      transformErrorResponse: (response: any) => ({
        status: response.status,
        message: response.data?.message || 'Error en el registro',
        errors: response.data?.errors || [],
      }),
    }),

    // Get user profile
    getProfile: builder.query<UserProfile, void>({
      query: () => 'auth/profile',
      providesTags: ['User'],
      transformResponse: (response: UserProfile) => response,
      transformErrorResponse: (response: any) => ({
        status: response.status,
        message: response.data?.message || 'Failed to fetch profile',
        errors: response.data?.errors || [],
      }),
    }),

    // Update user profile
    updateProfile: builder.mutation<UserProfile, UpdateProfileRequest>({
      query: (updateData) => ({
        url: 'auth/profile',
        method: 'PUT',
        body: updateData,
      }),
      invalidatesTags: ['User'],
      transformResponse: (response: UserProfile) => response,
      transformErrorResponse: (response: any) => ({
        status: response.status,
        message: response.data?.message || 'Profile update failed',
        errors: response.data?.errors || [],
      }),
    }),

    // Refresh token
    refreshToken: builder.mutation<RefreshResponse, RefreshRequest>({
      query: (refreshData) => ({
        url: 'auth/refresh',
        method: 'POST',
        body: refreshData,
      }),
      transformResponse: (response: ApiResponse<RefreshResponse>) => response.data,
      transformErrorResponse: (response: any) => ({
        status: response.status,
        message: response.data?.message || 'Token refresh failed',
        errors: response.data?.errors || [],
      }),
    }),

    // Logout
    logout: builder.mutation<void, void>({
      query: () => ({
        url: 'auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
      transformErrorResponse: (response: any) => ({
        status: response.status,
        message: response.data?.message || 'Logout failed',
        errors: response.data?.errors || [],
      }),
    }),

    // Get JWKS (public endpoint)
    getJwks: builder.query<any, void>({
      query: () => 'auth/jwks',
      transformResponse: (response: any) => response,
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useGetJwksQuery,
} = authApi;