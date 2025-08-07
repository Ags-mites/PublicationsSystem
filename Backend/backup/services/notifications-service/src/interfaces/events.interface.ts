export interface UserRegisteredEvent {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  registeredAt: Date;
}
export interface UserLoginEvent {
  userId: string;
  email: string;
  firstName: string;
  loginAt: Date;
  ipAddress: string;
  userAgent: string;
}
export interface PublicationSubmittedEvent {
  publicationId: string;
  title: string;
  authorId: string;
  authorName: string;
  submittedAt: Date;
  category: string;
}
export interface PublicationApprovedEvent {
  publicationId: string;
  title: string;
  authorId: string;
  authorName: string;
  approvedAt: Date;
  approvedBy: string;
}
export interface PublicationPublishedEvent {
  publicationId: string;
  title: string;
  authorId: string;
  authorName: string;
  publishedAt: Date;
  category: string;
  doi?: string;
}
export interface ReviewRequestedEvent {
  reviewId: string;
  publicationId: string;
  publicationTitle: string;
  reviewerId: string;
  reviewerName: string;
  authorId: string;
  requestedAt: Date;
  dueDate: Date;
}
export interface ReviewCompletedEvent {
  reviewId: string;
  publicationId: string;
  publicationTitle: string;
  reviewerId: string;
  reviewerName: string;
  authorId: string;
  completedAt: Date;
  decision: string; 
  comments?: string;
}