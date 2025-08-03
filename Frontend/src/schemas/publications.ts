import { z } from 'zod';
import { PublicationType } from '../types/api';

// Base Publication Schema
export const publicationSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(500, 'Title must not exceed 500 characters')
    .trim(),
  abstract: z.string()
    .min(50, 'Abstract must be at least 50 characters')
    .max(2000, 'Abstract must not exceed 2000 characters')
    .trim(),
  keywords: z.array(z.string().min(2, 'Each keyword must be at least 2 characters'))
    .min(3, 'At least 3 keywords are required')
    .max(10, 'Maximum 10 keywords allowed'),
  type: z.enum(['ARTICLE', 'BOOK']),
  coAuthorIds: z.array(z.string().uuid('Invalid author ID'))
    .optional()
    .default([]),
});

// Article Metadata Schema
export const articleMetadataSchema = z.object({
  targetJournal: z.string()
    .min(2, 'Target journal must be specified')
    .max(200, 'Target journal name too long'),
  section: z.string()
    .min(2, 'Section must be specified')
    .max(100, 'Section name too long'),
  bibliographicReferences: z.array(z.string().min(10, 'Reference must be at least 10 characters'))
    .min(1, 'At least one reference is required')
    .max(100, 'Maximum 100 references allowed'),
  figureCount: z.number()
    .int('Figure count must be a whole number')
    .min(0, 'Figure count cannot be negative')
    .max(50, 'Maximum 50 figures allowed')
    .default(0),
  tableCount: z.number()
    .int('Table count must be a whole number')
    .min(0, 'Table count cannot be negative')
    .max(20, 'Maximum 20 tables allowed')
    .default(0),
});

// Chapter Schema for Books
export const chapterSchema = z.object({
  chapterNumber: z.number()
    .int('Chapter number must be a whole number')
    .min(1, 'Chapter number must start from 1'),
  title: z.string()
    .min(3, 'Chapter title must be at least 3 characters')
    .max(200, 'Chapter title too long'),
  abstract: z.string()
    .min(20, 'Chapter abstract must be at least 20 characters')
    .max(500, 'Chapter abstract too long'),
  pageStart: z.number()
    .int('Page number must be a whole number')
    .min(1, 'Page number must be positive')
    .optional(),
  pageEnd: z.number()
    .int('Page number must be a whole number')
    .min(1, 'Page number must be positive')
    .optional(),
}).refine((data) => {
  if (data.pageStart && data.pageEnd) {
    return data.pageEnd >= data.pageStart;
  }
  return true;
}, {
  message: 'End page must be greater than or equal to start page',
  path: ['pageEnd'],
});

// Book Metadata Schema  
export const bookMetadataSchema = z.object({
  isbn: z.string()
    .regex(/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/, 'Invalid ISBN format')
    .optional()
    .or(z.literal('')),
  pageCount: z.number()
    .int('Page count must be a whole number')
    .min(1, 'Page count must be at least 1')
    .max(10000, 'Page count seems unrealistic')
    .optional(),
  edition: z.string()
    .min(1, 'Edition is required')
    .max(50, 'Edition description too long'),
  chapters: z.array(chapterSchema)
    .min(1, 'At least one chapter is required')
    .max(50, 'Maximum 50 chapters allowed'),
});

// Create Publication Schema
export const createPublicationSchema = publicationSchema.extend({
  metadata: z.union([articleMetadataSchema, bookMetadataSchema]),
});

export type CreatePublicationFormData = z.infer<typeof createPublicationSchema>;

// Update Publication Schema (all fields optional except type-specific validation)
export const updatePublicationSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(500, 'Title must not exceed 500 characters')
    .trim()
    .optional(),
  abstract: z.string()
    .min(50, 'Abstract must be at least 50 characters')
    .max(2000, 'Abstract must not exceed 2000 characters')
    .trim()
    .optional(),
  keywords: z.array(z.string().min(2, 'Each keyword must be at least 2 characters'))
    .min(3, 'At least 3 keywords are required')
    .max(10, 'Maximum 10 keywords allowed')
    .optional(),
  coAuthorIds: z.array(z.string().uuid('Invalid author ID'))
    .optional(),
  metadata: z.union([articleMetadataSchema, bookMetadataSchema])
    .optional(),
});

export type UpdatePublicationFormData = z.infer<typeof updatePublicationSchema>;

// Submit for Review Schema
export const submitForReviewSchema = z.object({
  reviewerIds: z.array(z.string().uuid('Invalid reviewer ID'))
    .max(10, 'Maximum 10 reviewers allowed')
    .optional(),
  notes: z.string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional()
    .or(z.literal('')),
});

export type SubmitForReviewFormData = z.infer<typeof submitForReviewSchema>;

// Publication Search Schema
export const publicationSearchSchema = z.object({
  query: z.string()
    .max(200, 'Search query too long')
    .optional()
    .or(z.literal('')),
  status: z.enum(['DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'WITHDRAWN'])
    .optional(),
  type: z.enum([PublicationType.ARTICLE, PublicationType.BOOK])
    .optional(),
  authorName: z.string()
    .max(100, 'Author name too long')
    .optional()
    .or(z.literal('')),
  dateFrom: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional()
    .or(z.literal('')),
  dateTo: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional()
    .or(z.literal('')),
}).refine((data) => {
  if (data.dateFrom && data.dateTo) {
    return new Date(data.dateTo) >= new Date(data.dateFrom);
  }
  return true;
}, {
  message: 'End date must be greater than or equal to start date',
  path: ['dateTo'],
});

export type PublicationSearchFormData = z.infer<typeof publicationSearchSchema>;

// Keywords Input Schema (for dynamic keyword input)
export const keywordInputSchema = z.object({
  keyword: z.string()
    .min(2, 'Keyword must be at least 2 characters')
    .max(50, 'Keyword too long')
    .regex(/^[a-zA-Z0-9\s-]+$/, 'Keyword can only contain letters, numbers, spaces, and hyphens')
    .trim(),
});

export type KeywordInputFormData = z.infer<typeof keywordInputSchema>;