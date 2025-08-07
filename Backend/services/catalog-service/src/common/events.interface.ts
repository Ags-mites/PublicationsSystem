export interface PublicationPublishedEvent {
  publicationId: string;
  title: string;
  abstract: string;
  keywords: string[];
  type: string;
  primaryAuthorId: string;
  primaryAuthorName: string;
  coAuthorIds: string[];
  coAuthorNames: string[];
  metadata: any;
  publishedAt: Date;
  category: string;
  isbn?: string;
  doi?: string;
  license?: string;
  downloadUrl?: string;
}

export interface PublicationWithdrawnEvent {
  publicationId: string;
  reason?: string;
  withdrawnAt: Date;
}

export interface AuthorCreatedEvent {
  authorId: string;
  fullName: string;
  affiliation: string;
  orcid?: string;
  createdAt: Date;
}

export interface AuthorUpdatedEvent {
  authorId: string;
  fullName?: string;
  affiliation?: string;
  orcid?: string;
  updatedAt: Date;
}