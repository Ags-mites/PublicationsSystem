# Microservices API Documentation

## Overview

This document provides comprehensive API documentation for the Academic Publications Management System, built with a microservices architecture. All services are accessible through an API Gateway at `http://localhost:3000`.

## Table of Contents

1. [Authentication Headers](#authentication-headers)
2. [Standard Response Formats](#standard-response-formats)
3. [Auth Service Endpoints](#auth-service-endpoints)
4. [Publications Service Endpoints](#publications-service-endpoints)
5. [Catalog Service Endpoints](#catalog-service-endpoints)
6. [Notifications Service Endpoints](#notifications-service-endpoints)
7. [Gateway Health & Utilities](#gateway-health--utilities)
8. [Common Data Types](#common-data-types)
9. [WebSocket Endpoints](#websocket-endpoints)
10. [Error Response Format](#error-response-format)

## Authentication Headers

```typescript
interface ApiHeaders {
  'Authorization': `Bearer ${jwtToken}`
  'X-Correlation-ID': string
  'Content-Type': 'application/json'
}
```

## Standard Response Formats

```typescript
interface ApiResponse<T> {
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

interface PaginationMeta {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}
```

## Auth Service Endpoints

### Authentication & User Management

#### POST /api/auth/register
Register a new user account.

```typescript
interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string // Min 8 chars, uppercase, lowercase, number, special char
  roles?: UserRole[]
  affiliation?: string
  orcid?: string // Format: 0000-0000-0000-0000
  biography?: string
}

interface RegisterResponse {
  user: UserProfile
  accessToken: string
  refreshToken: string
}
```

#### POST /api/auth/login
Authenticate user credentials.

```typescript
interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  user: UserProfile
  accessToken: string
  refreshToken: string
}
```

#### POST /api/auth/refresh
Refresh access token using refresh token.

```typescript
interface RefreshRequest {
  refreshToken: string
}

interface RefreshResponse {
  accessToken: string
  refreshToken: string
}
```

#### GET /api/auth/profile
Get authenticated user's profile information.

```typescript
interface UserProfile {
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
```

#### PUT /api/auth/profile
Update user profile information.

```typescript
interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  affiliation?: string
  orcid?: string
  biography?: string
  profileImageUrl?: string
}
```

#### POST /api/auth/logout
Logout user and invalidate tokens (requires authentication).

```typescript
interface LogoutRequest {
  refreshToken?: string
}
```

#### POST /api/auth/introspect
Validate and introspect token.

```typescript
interface IntrospectRequest {
  token: string
}

interface IntrospectResponse {
  active: boolean
  sub?: string
  exp?: number
  iat?: number
  scope?: string[]
}
```

#### GET /api/auth/jwks
Get JSON Web Key Set for token verification (public endpoint).

#### GET /api/auth/users
Get all users (Admin only, requires ROLE_ADMIN).

## Publications Service Endpoints

### Publications CRUD

#### GET /api/publications
Get publications with filtering and pagination.

```typescript
interface PublicationsQueryParams {
  primaryAuthorId?: string
  status?: PublicationStatus
  type?: PublicationType
  page?: number // Default: 1
  limit?: number // Default: 10
}

interface PublicationListItem {
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
```

#### POST /api/publications
Create a new publication draft.

```typescript
interface CreatePublicationRequest {
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

interface CreatePublicationResponse {
  id: string
  title: string
  status: PublicationStatus.DRAFT
  // ... other publication fields
}
```

#### GET /api/publications/:id
Get publication details by ID.

```typescript
interface PublicationDetail {
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
```

#### PUT /api/publications/:id
Update publication (only in DRAFT status).

```typescript
interface UpdatePublicationRequest {
  title?: string
  abstract?: string
  keywords?: string[]
  coAuthorIds?: string[]
  metadata?: Record<string, any>
}
```

### Publication Workflow

#### POST /api/publications/:id/submit-for-review
Submit publication for review process.

```typescript
interface SubmitForReviewResponse {
  id: string
  status: PublicationStatus.IN_REVIEW
  submittedAt: string
}
```

#### PUT /api/publications/:id/approve
Approve publication (Editor/Admin only).

```typescript
interface ApprovePublicationResponse {
  id: string
  status: PublicationStatus.APPROVED
}
```

#### PUT /api/publications/:id/publish
Publish approved publication (Editor/Admin only).

```typescript
interface PublishPublicationResponse {
  id: string
  status: PublicationStatus.PUBLISHED
  publishedAt: string
}
```

#### PUT /api/publications/:id/withdraw
Withdraw publication.

```typescript
interface WithdrawPublicationResponse {
  id: string
  status: PublicationStatus.WITHDRAWN
}
```

#### GET /api/publications/:id/history
Get publication status change history.

```typescript
interface StatusHistoryItem {
  id: string
  fromStatus: PublicationStatus
  toStatus: PublicationStatus
  changedBy: string
  changedByName: string
  notes?: string
  timestamp: string
}
```

## Catalog Service Endpoints

### Public Catalog Access

#### GET /api/catalog/publications
Search published publications with advanced filtering.

```typescript
interface CatalogSearchParams {
  q?: string // Full-text search
  type?: PublicationType
  author?: string
  category?: string
  yearFrom?: number
  yearTo?: number
  page?: number // Default: 1
  limit?: number // Default: 20, Max: 100
  sortBy?: 'relevance' | 'date' | 'title' // Default: relevance
  sortOrder?: 'asc' | 'desc' // Default: desc
}

interface CatalogSearchResponse {
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

interface SearchFacets {
  types: { type: string, count: number }[]
  categories: { category: string, count: number }[]
  years: { year: number, count: number }[]
  authors: { authorId: string, authorName: string, count: number }[]
}

interface CatalogPublicationItem {
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
```

#### GET /api/catalog/publications/:id
Get publication details from catalog.

```typescript
interface CatalogPublicationDetail {
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

interface CatalogAuthorDetail {
  id: string
  originalId: string
  fullName: string
  affiliation: string
  orcid?: string
  biography?: string
  publicationCount: number
}
```

#### GET /api/catalog/search
Advanced search with facets (alias for GET /api/catalog/publications).

#### GET /api/catalog/categories
Get all available publication categories with counts.

```typescript
interface CategorySummary {
  category: string
  count: number
}
```

#### GET /api/catalog/statistics
Get catalog statistics and metrics.

```typescript
interface CatalogStatistics {
  totalPublications: number
  totalAuthors: number
  publicationsByType: { type: string, count: number }[]
  publicationsByYear: { year: number, count: number }[]
  topCategories: { category: string, count: number }[]
  recentPublications: CatalogPublicationItem[]
}
```

## Notifications Service Endpoints

### User Notifications

#### GET /api/notifications
Get user notifications with filtering and pagination.

```typescript
interface NotificationsQueryParams {
  userId: string
  status?: NotificationStatus
  type?: NotificationType
  channel?: NotificationChannel
  page?: number // Default: 1
  limit?: number // Default: 20
}

interface NotificationItem {
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
```

#### GET /api/notifications/unread-count
Get count of unread notifications for user.

```typescript
interface UnreadCountResponse {
  unreadCount: number
  userId: string
}
```

#### PUT /api/notifications/:id/mark-read
Mark notification as read or unread.

```typescript
interface MarkNotificationReadRequest {
  isRead: boolean
}

interface MarkNotificationReadResponse {
  message: string
  notificationId: string
}
```

#### PUT /api/notifications/mark-all-read
Mark all notifications as read for user.

```typescript
interface MarkAllReadResponse {
  message: string
  updatedCount: number
  userId: string
}
```

#### DELETE /api/notifications/:id
Delete a specific notification.

```typescript
interface DeleteNotificationResponse {
  message: string
  notificationId: string
}
```

#### DELETE /api/notifications/clear-all
Clear all read notifications for user.

```typescript
interface ClearAllReadResponse {
  message: string
  deletedCount: number
  userId: string
}
```

#### GET /api/notifications/stats
Get notification statistics for user.

```typescript
interface NotificationStats {
  userId: string
  totalNotifications: number
  unread: number
  read: number
  failed: number
  byType: { type: string, count: number }[]
  byChannel: { channel: string, count: number }[]
}
```

## Gateway Health & Utilities

#### GET /health
System health check.

```typescript
interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  service: string
  version: string
}
```

## Common Data Types

### Enums

```typescript
enum PublicationStatus {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  WITHDRAWN = 'WITHDRAWN'
}

enum PublicationType {
  ARTICLE = 'ARTICLE',
  BOOK = 'BOOK'
}

enum UserRole {
  ROLE_AUTHOR = 'ROLE_AUTHOR',
  ROLE_REVIEWER = 'ROLE_REVIEWER',
  ROLE_EDITOR = 'ROLE_EDITOR',
  ROLE_ADMIN = 'ROLE_ADMIN',
  ROLE_READER = 'ROLE_READER'
}

enum NotificationType {
  USER_LOGIN = 'USER_LOGIN',
  USER_REGISTERED = 'USER_REGISTERED',
  PUBLICATION_SUBMITTED = 'PUBLICATION_SUBMITTED',
  PUBLICATION_APPROVED = 'PUBLICATION_APPROVED',
  PUBLICATION_PUBLISHED = 'PUBLICATION_PUBLISHED',
  REVIEW_REQUESTED = 'REVIEW_REQUESTED',
  REVIEW_COMPLETED = 'REVIEW_COMPLETED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED'
}

enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  READ = 'READ'
}

enum NotificationChannel {
  EMAIL = 'EMAIL',
  WEBSOCKET = 'WEBSOCKET',
  PUSH = 'PUSH'
}
```

### Common Interfaces

```typescript
interface AuthorSummary {
  id: string
  firstName: string
  lastName: string
  affiliation?: string
}

interface AuthorDetail extends AuthorSummary {
  email: string
  orcid?: string
  biography?: string
  profileImageUrl?: string
}
```

## WebSocket Endpoints

### Real-time Notifications

```typescript
// WebSocket connection: ws://localhost:3000/notifications
interface WebSocketEvents {
  // Client to server
  'subscribe': { userId: string }
  'unsubscribe': { userId: string }
  
  // Server to client
  'notification': NotificationItem
  'notification.read': { notificationId: string }
  'user.online': { userId: string }
  'user.offline': { userId: string }
}
```

## Error Response Format

```typescript
interface ErrorResponse {
  success: false
  message: string
  errors: string[]
  statusCode: number
  timestamp: string
  path: string
  correlationId: string
}
```

## Rate Limiting

Most endpoints implement rate limiting:
- Search endpoints: 30 requests/minute
- Read operations: 60 requests/minute
- Write operations: 30 requests/minute
- Admin operations: 10 requests/minute

## Caching

Catalog service implements caching:
- Search results: 5 minutes
- Publication details: 10 minutes
- Categories: 1 hour
- Statistics: 30 minutes

## Frontend Integration Notes

1. **Authentication**: All authenticated endpoints require `Bearer ${token}` in Authorization header
2. **Correlation ID**: Include `X-Correlation-ID` header for request tracing
3. **Error Handling**: Check `success` field in responses before accessing `data`
4. **Pagination**: Use provided pagination metadata for UI controls
5. **Real-time Updates**: Connect to WebSocket for live notification updates
6. **Type Safety**: Use provided TypeScript interfaces for proper type checking

This documentation serves as the complete contract between frontend and backend teams for building the React application.