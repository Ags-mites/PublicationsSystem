import { z } from 'zod';
import { PublicationType } from '../types/api';

// Catalog Search Schema
export const catalogSearchSchema = z.object({
  q: z.string()
    .max(200, 'Search query too long')
    .optional()
    .or(z.literal('')),
  type: z.enum(['ARTICLE', 'BOOK'])
    .optional(),
  author: z.string()
    .max(100, 'Author name too long')
    .optional()
    .or(z.literal('')),
  category: z.string()
    .max(100, 'Category name too long')
    .optional()
    .or(z.literal('')),
  yearFrom: z.number()
    .int('Year must be a whole number')
    .min(1800, 'Year must be after 1800')
    .max(new Date().getFullYear(), 'Year cannot be in the future')
    .optional(),
  yearTo: z.number()
    .int('Year must be a whole number') 
    .min(1800, 'Year must be after 1800')
    .max(new Date().getFullYear(), 'Year cannot be in the future')
    .optional(),
  sortBy: z.enum(['relevance', 'date', 'title'])
    .default('relevance'),
  sortOrder: z.enum(['asc', 'desc'])
    .default('desc'),
  page: z.number()
    .int('Page must be a whole number')
    .min(1, 'Page must be at least 1')
    .default(1),
  limit: z.number()
    .int('Limit must be a whole number')
    .min(5, 'Minimum 5 results per page')
    .max(100, 'Maximum 100 results per page')
    .default(20),
}).refine((data) => {
  if (data.yearFrom && data.yearTo) {
    return data.yearTo >= data.yearFrom;
  }
  return true;
}, {
  message: 'End year must be greater than or equal to start year',
  path: ['yearTo'],
});

export type CatalogSearchFormData = z.infer<typeof catalogSearchSchema>;

// Advanced Search Schema
export const advancedCatalogSearchSchema = catalogSearchSchema.extend({
  keywords: z.array(z.string().min(2, 'Each keyword must be at least 2 characters'))
    .max(10, 'Maximum 10 keywords allowed')
    .optional(),
  exactTitle: z.boolean().default(false),
  includeAbstract: z.boolean().default(true),
  minPages: z.number()
    .int('Page count must be a whole number')
    .min(1, 'Minimum page count must be positive')
    .optional(),
  maxPages: z.number()
    .int('Page count must be a whole number')
    .min(1, 'Maximum page count must be positive')
    .optional(),
  hasISBN: z.boolean().optional(),
  hasDOI: z.boolean().optional(),
  isOpenAccess: z.boolean().optional(),
}).refine((data) => {
  if (data.minPages && data.maxPages) {
    return data.maxPages >= data.minPages;
  }
  return true;
}, {
  message: 'Maximum pages must be greater than or equal to minimum pages',
  path: ['maxPages'],
});

export type AdvancedCatalogSearchFormData = z.infer<typeof advancedCatalogSearchSchema>;

// Filter Options Schema (for form state management)
export const catalogFiltersSchema = z.object({
  selectedTypes: z.array(z.enum(['ARTICLE', 'BOOK']))
    .default([]),
  selectedCategories: z.array(z.string())
    .default([]),
  selectedAuthors: z.array(z.string())
    .default([]),
  selectedYears: z.array(z.number())
    .default([]),
  priceRange: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional(),
  }).optional(),
  availability: z.enum(['all', 'free', 'paid'])
    .default('all'),
});

export type CatalogFiltersFormData = z.infer<typeof catalogFiltersSchema>;