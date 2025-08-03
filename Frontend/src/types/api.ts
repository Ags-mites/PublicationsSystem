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

export enum PublicationStatus {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  WITHDRAWN = 'WITHDRAWN'
}

export enum PublicationType {
  ARTICLE = 'ARTICLE',
  BOOK = 'BOOK'
}

export enum UserRole {
  ROLE_AUTHOR = 'ROLE_AUTHOR',
  ROLE_REVIEWER = 'ROLE_REVIEWER',
  ROLE_EDITOR = 'ROLE_EDITOR',
  ROLE_ADMIN = 'ROLE_ADMIN',
  ROLE_READER = 'ROLE_READER'
}

export enum NotificationType {
  USER_LOGIN = 'USER_LOGIN',
  USER_REGISTERED = 'USER_REGISTERED',
  PUBLICATION_SUBMITTED = 'PUBLICATION_SUBMITTED',
  PUBLICATION_APPROVED = 'PUBLICATION_APPROVED',
  PUBLICATION_PUBLISHED = 'PUBLICATION_PUBLISHED',
  REVIEW_REQUESTED = 'REVIEW_REQUESTED',
  REVIEW_COMPLETED = 'REVIEW_COMPLETED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED'
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  READ = 'READ'
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  WEBSOCKET = 'WEBSOCKET',
  PUSH = 'PUSH'
}

// ============================================================================
// AUTH SERVICE TYPES
// ============================================================================

export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  roles: UserRole[]
  affiliation?: string
  orcid?: string
  biography?: string
  profileImageUrl?: string
  emailVerified: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  roles?: UserRole[]
  affiliation?: string
  orcid?: string
  biography?: string
}

export interface RegisterResponse {
  user: UserProfile
  accessToken: string
  refreshToken: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
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