export enum PublicationStatus {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum PublicationType {
  ARTICLE = 'ARTICLE',
  BOOK = 'BOOK',
}

export enum ReviewStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RETURNED = 'RETURNED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export enum OutboxStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export enum ChangeSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
} 