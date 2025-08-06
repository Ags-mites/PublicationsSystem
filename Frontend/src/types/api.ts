// API Types for Academic Publications Management System

// ============================================================================
// COMMON TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: string[]
  metadata?: {
    timestamp: string
    correlationId: string
    pagination?: PaginationMeta
  }
}

export interface PaginationMeta {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface ErrorResponse {
  success: false
  message: string
  errors: string[]
  statusCode: number
  timestamp: string
  path: string
  correlationId: string
}

export interface ApiHeaders {
  'Authorization': `Bearer ${string}`
  'X-Correlation-ID': string
  'Content-Type': 'application/json'
}

// ============================================================================
// ENUMS
// ============================================================================

export const PublicationStatus = {
  DRAFT: 'DRAFT',
  IN_REVIEW: 'IN_REVIEW',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
  APPROVED: 'APPROVED',
  PUBLISHED: 'PUBLISHED',
  WITHDRAWN: 'WITHDRAWN'
} as const;

export type PublicationStatus = typeof PublicationStatus[keyof typeof PublicationStatus];

export const PublicationType = {
  ARTICLE: 'ARTICLE',
  BOOK: 'BOOK'
} as const;

export type PublicationType = typeof PublicationType[keyof typeof PublicationType];

export const UserRole = {
  ROLE_AUTOR: 'ROLE_AUTOR',
  ROLE_REVISOR: 'ROLE_REVISOR',
  ROLE_EDITOR: 'ROLE_EDITOR',
  ROLE_ADMIN: 'ROLE_ADMIN',
  ROLE_READER: 'ROLE_READER'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export const NotificationType = {
  USER_LOGIN: 'USER_LOGIN',
  USER_REGISTERED: 'USER_REGISTERED',
  PUBLICATION_SUBMITTED: 'PUBLICATION_SUBMITTED',
  PUBLICATION_APPROVED: 'PUBLICATION_APPROVED',
  PUBLICATION_PUBLISHED: 'PUBLICATION_PUBLISHED',
  REVIEW_REQUESTED: 'REVIEW_REQUESTED',
  REVIEW_COMPLETED: 'REVIEW_COMPLETED',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED'
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export const NotificationStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
  READ: 'READ'
} as const;

export type NotificationStatus = typeof NotificationStatus[keyof typeof NotificationStatus];

export const NotificationChannel = {
  EMAIL: 'EMAIL',
  WEBSOCKET: 'WEBSOCKET',
  PUSH: 'PUSH'
} as const;

export type NotificationChannel = typeof NotificationChannel[keyof typeof NotificationChannel];

// ============================================================================
// AUTH SERVICE TYPES
// ============================================================================

export interface UserProfile {
  id: number
  firstName: string
  lastName: string
  email: string
  role: UserRole
  affiliation?: string
  orcid?: string
  biography?: string
  profileImageUrl?: string
  emailVerified?: boolean
  lastLoginAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  role?: UserRole
  affiliation?: string
  orcid?: string
  biography?: string
}

export interface RegisterResponse {
  message: string
  user: UserProfile
  accessToken: string
  refreshToken: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  message: string
  user: UserProfile
  accessToken: string
  refreshToken: string
}

export interface RefreshRequest {
  refreshToken: string
}

export interface RefreshResponse {
  accessToken: string
  refreshToken: string
}

export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  affiliation?: string
  orcid?: string
  biography?: string
  profileImageUrl?: string
}

export interface LogoutRequest {
  refreshToken?: string
}

export interface IntrospectRequest {
  token: string
}

export interface IntrospectResponse {
  active: boolean
  sub?: string
  exp?: number
  iat?: number
  scope?: string[]
}

// ============================================================================
// PUBLICATIONS SERVICE TYPES
// ============================================================================

export interface PublicationListItem {
  id: string
  title: string
  abstract: string
  keywords: string[]
  type: PublicationType
  status: PublicationStatus
  currentVersion: number
  primaryAuthorId: string
  coAuthorIds: string[]
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
  submittedAt?: string
  publishedAt?: string
}

export interface PublicationDetail {
  id: string
  title: string
  abstract: string
  keywords: string[]
  type: PublicationType
  status: PublicationStatus
  currentVersion: number
  primaryAuthorId: string
  coAuthorIds: string[]
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
  submittedAt?: string
  publishedAt?: string
}

export interface PublicationsQueryParams {
  primaryAuthorId?: string
  status?: PublicationStatus
  type?: PublicationType
  page?: number
  limit?: number
}

export interface CreatePublicationRequest {
  title: string
  abstract: string
  keywords: string[]
  primaryAuthorId: string
  coAuthorIds: string[]
  type: PublicationType
  metadata?: Record<string, any>
  article?: {
    targetJournal: string
    section: string
    bibliographicReferences: string[]
    figureCount?: number
    tableCount?: number
  }
  book?: {
    isbn: string
    pageCount: number
    edition: string
  }
}

export interface CreatePublicationResponse {
  id: string
  title: string
  status: PublicationStatus.DRAFT
}

export interface UpdatePublicationRequest {
  title?: string
  abstract?: string
  keywords?: string[]
  coAuthorIds?: string[]
  metadata?: Record<string, any>
}

export interface SubmitForReviewResponse {
  id: string
  status: PublicationStatus.IN_REVIEW
  submittedAt: string
}

export interface ApprovePublicationResponse {
  id: string
  status: PublicationStatus.APPROVED
}

export interface PublishPublicationResponse {
  id: string
  status: PublicationStatus.PUBLISHED
  publishedAt: string
}

export interface WithdrawPublicationResponse {
  id: string
  status: PublicationStatus.WITHDRAWN
}

// ============================================================================
// REVIEWS SERVICE TYPES
// ============================================================================

export interface ReviewSummary {
  id: string
  publicationId: string
  publicationTitle: string
  reviewerId: string
  reviewerName: string
  status: ReviewStatus
  createdAt: string
  completedAt?: string
}

export interface ReviewDetail {
  id: string
  publicationId: string
  publicationTitle: string
  reviewerId: string
  reviewerName: string
  status: ReviewStatus
  overallRecommendation?: ReviewRecommendation
  comments: string
  strengths?: string
  weaknesses?: string
  suggestions?: string
  confidenceLevel?: number
  createdAt: string
  completedAt?: string
  changeRequests: ChangeRequest[]
}

export interface CreateReviewRequest {
  publicationId: string
  comments?: string
}

export interface CompleteReviewRequest {
  overallRecommendation: ReviewRecommendation
  comments: string
  strengths?: string
  weaknesses?: string
  suggestions?: string
  confidenceLevel?: number
  changeRequests?: ChangeRequestInput[]
}

export interface ChangeRequest {
  id: string
  description: string
  severity: ChangeSeverity
  section?: string
  lineNumber?: number
  originalText?: string
  suggestedText?: string
  status: ChangeRequestStatus
  createdAt: string
}

export interface ChangeRequestInput {
  description: string
  severity: ChangeSeverity
  section?: string
  lineNumber?: number
  originalText?: string
  suggestedText?: string
}

export interface SubmitForReviewRequest {
  notes?: string
}

export interface ApprovePublicationRequest {
  notes?: string
}

export interface PublishPublicationRequest {
  notes?: string
}

export interface RequestChangesRequest {
  notes: string
  changeRequests: ChangeRequestInput[]
}

// Review-related enums
export const ReviewStatus = {
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  DECLINED: 'DECLINED'
} as const;

export type ReviewStatus = typeof ReviewStatus[keyof typeof ReviewStatus];

export const ReviewRecommendation = {
  ACCEPT: 'ACCEPT',
  MINOR_REVISIONS: 'MINOR_REVISIONS',
  MAJOR_REVISIONS: 'MAJOR_REVISIONS',
  REJECT: 'REJECT'
} as const;

export type ReviewRecommendation = typeof ReviewRecommendation[keyof typeof ReviewRecommendation];

export const ChangeSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
} as const;

export type ChangeSeverity = typeof ChangeSeverity[keyof typeof ChangeSeverity];

export const ChangeRequestStatus = {
  PENDING: 'PENDING',
  ADDRESSED: 'ADDRESSED',
  REJECTED: 'REJECTED'
} as const;

export type ChangeRequestStatus = typeof ChangeRequestStatus[keyof typeof ChangeRequestStatus];

export interface StatusHistoryItem {
  id: string
  fromStatus: PublicationStatus
  toStatus: PublicationStatus
  changedBy: string
  changedByName: string
  notes?: string
  timestamp: string
}

// ============================================================================
// CATALOG SERVICE TYPES
// ============================================================================

export interface CatalogSearchParams {
  q?: string
  type?: PublicationType
  author?: string
  category?: string
  yearFrom?: number
  yearTo?: number
  page?: number
  limit?: number
  sortBy?: 'relevance' | 'date' | 'title'
  sortOrder?: 'asc' | 'desc'
}

export interface CatalogSearchResponse {
  publications: CatalogPublicationItem[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  facets: SearchFacets
  executionTime: number
}

export interface SearchFacets {
  types: { type: string, count: number }[]
  categories: { category: string, count: number }[]
  years: { year: number, count: number }[]
  authors: { authorId: string, authorName: string, count: number }[]
}

export interface CatalogPublicationItem {
  id: string
  originalId: string
  title: string
  abstract: string
  keywords: string[]
  type: PublicationType
  primaryAuthor: string
  coAuthors: string[]
  category: string
  publishedAt: string
  isbn?: string
  doi?: string
  downloadUrl?: string
}

export interface CatalogPublicationDetail {
  id: string
  originalId: string
  title: string
  abstract: string
  keywords: string[]
  type: PublicationType
  primaryAuthor: CatalogAuthorDetail
  coAuthors: CatalogAuthorDetail[]
  metadata: Record<string, any>
  category: string
  license: string
  publishedAt: string
  isbn?: string
  doi?: string
  downloadUrl?: string
  relatedPublications: CatalogPublicationItem[]
}

export interface CatalogAuthorDetail {
  id: string
  originalId: string
  fullName: string
  affiliation: string
  orcid?: string
  biography?: string
  publicationCount: number
}

export interface CategorySummary {
  category: string
  count: number
}

export interface CatalogStatistics {
  totalPublications: number
  totalAuthors: number
  publicationsByType: { type: string, count: number }[]
  publicationsByYear: { year: number, count: number }[]
  topCategories: { category: string, count: number }[]
  recentPublications: CatalogPublicationItem[]
}

// ============================================================================
// NOTIFICATIONS SERVICE TYPES
// ============================================================================

export interface NotificationItem {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  channel: NotificationChannel
  status: NotificationStatus
  metadata: Record<string, any>
  createdAt: string
  sentAt?: string
  readAt?: string
  retryCount: number
  maxRetries: number
}

export interface NotificationsQueryParams {
  userId: string
  status?: NotificationStatus
  type?: NotificationType
  channel?: NotificationChannel
  page?: number
  limit?: number
}

export interface UnreadCountResponse {
  unreadCount: number
  userId: string
}

export interface MarkNotificationReadRequest {
  isRead: boolean
}

export interface MarkNotificationReadResponse {
  message: string
  notificationId: string
}

export interface MarkAllReadResponse {
  message: string
  updatedCount: number
  userId: string
}

export interface DeleteNotificationResponse {
  message: string
  notificationId: string
}

export interface ClearAllReadResponse {
  message: string
  deletedCount: number
  userId: string
}

export interface NotificationStats {
  userId: string
  totalNotifications: number
  unread: number
  read: number
  failed: number
  byType: { type: string, count: number }[]
  byChannel: { channel: string, count: number }[]
}

// Additional notification types
export interface NotificationSubscription {
  id: string
  userId: string
  type: NotificationType
  channel: NotificationChannel
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSubscriptionRequest {
  type: NotificationType
  channel: NotificationChannel
  enabled?: boolean
}

export interface UpdateSubscriptionRequest {
  enabled: boolean
}

export interface NotificationPreferences {
  id: string
  userId: string
  emailNotifications: boolean
  pushNotifications: boolean
  websocketNotifications: boolean
  notificationTypes: NotificationType[]
  createdAt: string
  updatedAt: string
}

export interface UpdatePreferencesRequest {
  emailNotifications?: boolean
  pushNotifications?: boolean
  websocketNotifications?: boolean
  notificationTypes?: NotificationType[]
}

// Additional catalog types
export interface CatalogAuthor {
  id: string
  originalId: string
  fullName: string
  affiliation: string
  orcid?: string
  biography?: string
  publicationCount: number
}

export interface AuthorPublications {
  author: CatalogAuthor
  publications: CatalogPublicationItem[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// ============================================================================
// COMMON INTERFACES
// ============================================================================

export interface AuthorSummary {
  id: string
  firstName: string
  lastName: string
  affiliation?: string
}

export interface AuthorDetail extends AuthorSummary {
  email: string
  orcid?: string
  biography?: string
  profileImageUrl?: string
}

// ============================================================================
// WEBSOCKET TYPES
// ============================================================================

export interface WebSocketEvents {
  // Client to server
  'subscribe': { userId: string }
  'unsubscribe': { userId: string }
  
  // Server to client
  'notification': NotificationItem
  'notification.read': { notificationId: string }
  'user.online': { userId: string }
  'user.offline': { userId: string }
}

// ============================================================================
// HEALTH CHECK TYPES
// ============================================================================

export interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  service: string
  version: string
} 