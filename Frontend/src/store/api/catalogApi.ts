import { baseApi } from './baseApi';
import type {
  CatalogSearchParams,
  CatalogSearchResponse,
  CatalogPublicationDetail,
  CatalogAuthor,
  AuthorPublications,
  CategorySummary,
  CatalogStatistics,
  ApiResponse,
} from '../../types/api';

export const catalogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Search catalog publications
    searchCatalog: builder.query<CatalogSearchResponse, CatalogSearchParams>({
      query: (params) => ({
        url: 'catalog/publications',
        params: {
          ...params,
          page: params.page || 1,
          limit: params.limit || 20,
          sortBy: params.sortBy || 'relevance',
          sortOrder: params.sortOrder || 'desc',
        },
      }),
      providesTags: ['CatalogPublication'],
      transformResponse: (response: CatalogSearchResponse) => response,
    }),

    // Get catalog publication detail
    getCatalogPublication: builder.query<CatalogPublicationDetail, string>({
      query: (id) => `catalog/publications/${id}`,
      providesTags: (result, error, id) => [{ type: 'CatalogPublication', id }],
      transformResponse: (response: CatalogPublicationDetail) => response,
    }),

    // Get catalog authors
    getCatalogAuthors: builder.query<CatalogAuthor[], void>({
      query: () => 'catalog/authors',
      providesTags: ['Author'],
      transformResponse: (response: ApiResponse<CatalogAuthor[]>) => response.data,
    }),

    // Get author publications
    getAuthorPublications: builder.query<AuthorPublications, string>({
      query: (id) => `catalog/authors/${id}/publications`,
      providesTags: (result, error, id) => [{ type: 'Author', id }],
      transformResponse: (response: AuthorPublications) => response,
    }),

    // Get categories
    getCategories: builder.query<CategorySummary[], void>({
      query: () => 'catalog/categories',
      providesTags: ['Category'],
      transformResponse: (response: CategorySummary[]) => response,
    }),

    // Get catalog statistics
    getCatalogStatistics: builder.query<CatalogStatistics, void>({
      query: () => 'catalog/statistics',
      providesTags: ['Statistics'],
      transformResponse: (response: CatalogStatistics) => response,
    }),
  }),
});

export const {
  useSearchCatalogQuery,
  useGetCatalogPublicationQuery,
  useGetCatalogAuthorsQuery,
  useGetAuthorPublicationsQuery,
  useGetCategoriesQuery,
  useGetCatalogStatisticsQuery,
} = catalogApi;