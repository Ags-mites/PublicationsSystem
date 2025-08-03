import { z } from 'zod';

// Change Request Schema
export const changeRequestSchema = z.object({
  section: z.string()
    .min(3, 'Section must be at least 3 characters')
    .max(100, 'Section name too long'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description too long'),
  suggestion: z.string()
    .max(1000, 'Suggestion too long')
    .optional()
    .or(z.literal('')),
});

export type ChangeRequestFormData = z.infer<typeof changeRequestSchema>;

// Complete Review Schema
export const completeReviewSchema = z.object({
  comments: z.string()
    .min(50, 'Comments must be at least 50 characters')
    .max(5000, 'Comments too long')
    .trim(),
  score: z.number()
    .min(1, 'Score must be between 1 and 10')
    .max(10, 'Score must be between 1 and 10')
    .int('Score must be a whole number'),
  changeRequests: z.array(changeRequestSchema)
    .max(20, 'Maximum 20 change requests allowed')
    .default([]),
  recommendation: z.enum(['ACCEPT', 'MINOR_CHANGES', 'MAJOR_CHANGES', 'REJECT']),
});

export type CompleteReviewFormData = z.infer<typeof completeReviewSchema>;

// Review Search Schema
export const reviewSearchSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'RETURNED', 'ACCEPTED', 'REJECTED'])
    .optional(),
  publicationTitle: z.string()
    .max(200, 'Publication title too long')
    .optional()
    .or(z.literal('')),
  scoreMin: z.number()
    .min(1, 'Minimum score must be between 1 and 10')
    .max(10, 'Minimum score must be between 1 and 10')
    .optional(),
  scoreMax: z.number()
    .min(1, 'Maximum score must be between 1 and 10')
    .max(10, 'Maximum score must be between 1 and 10')
    .optional(),
  dateFrom: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional()
    .or(z.literal('')),
  dateTo: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional()
    .or(z.literal('')),
}).refine((data) => {
  if (data.scoreMin && data.scoreMax) {
    return data.scoreMax >= data.scoreMin;
  }
  return true;
}, {
  message: 'Maximum score must be greater than or equal to minimum score',
  path: ['scoreMax'],
}).refine((data) => {
  if (data.dateFrom && data.dateTo) {
    return new Date(data.dateTo) >= new Date(data.dateFrom);
  }
  return true;
}, {
  message: 'End date must be greater than or equal to start date',
  path: ['dateTo'],
});

export type ReviewSearchFormData = z.infer<typeof reviewSearchSchema>;