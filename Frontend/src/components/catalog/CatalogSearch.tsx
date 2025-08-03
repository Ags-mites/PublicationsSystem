import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useSearchCatalogQuery } from '../../store/api/catalogApi';
import { PublicationType, type CatalogSearchParams } from '../../types/api';
import { format } from 'date-fns';

const CatalogSearch: React.FC = () => {
  const [searchParams, setSearchParams] = useState<CatalogSearchParams>({
    q: '',
    page: 1,
    limit: 20,
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  const { data: searchResult, isLoading, error } = useSearchCatalogQuery(searchParams);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(prev => ({ ...prev, page: 1 }));
  };

  const handleQueryChange = (query: string) => {
    setSearchParams(prev => ({ ...prev, q: query }));
  };

  const handleFilterChange = (key: keyof CatalogSearchParams, value: any) => {
    setSearchParams(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case PublicationType.ARTICLE:
        return '📄';
      case PublicationType.BOOK:
        return '📚';
      default:
        return '📄';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Publications Catalog</CardTitle>
          <CardDescription>
            Search and discover published academic works
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <Input
                type="text"
                placeholder="Search publications, authors, keywords..."
                value={searchParams.q}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="type" className="text-sm font-medium">
                  Type:
                </label>
                <select
                  id="type"
                  value={searchParams.type || ''}
                  onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="">All Types</option>
                  <option value={PublicationType.ARTICLE}>Articles</option>
                  <option value={PublicationType.BOOK}>Books</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="sortBy" className="text-sm font-medium">
                  Sort by:
                </label>
                <select
                  id="sortBy"
                  value={searchParams.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Publication Date</option>
                  <option value="title">Title</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="sortOrder" className="text-sm font-medium">
                  Order:
                </label>
                <select
                  id="sortOrder"
                  value={searchParams.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
      <Card>
        <CardHeader>
          <CardTitle>Search Results</CardTitle>
          {searchResult && (
            <CardDescription>
              Found {searchResult.pagination.totalCount} publications
              {searchParams.q && ` for "${searchParams.q}"`}
              {searchResult.executionTime && 
                ` (${searchResult.executionTime}ms)`
              }
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">
                Failed to search publications. Please try again.
              </p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : !searchResult || searchResult.publications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">
                {searchParams.q 
                  ? `No publications found for "${searchParams.q}"`
                  : 'No publications available. Be the first to publish!'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {searchResult.publications.map((publication) => (
                <div
                  key={publication.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getTypeIcon(publication.type)}</span>
                        <Link
                          to={`/catalog/${publication.id}`}
                          className="text-lg font-semibold hover:text-blue-600 transition-colors"
                        >
                          {publication.title}
                        </Link>
                      </div>
                      
                      <p className="text-gray-600 mb-3 line-clamp-3">
                        {publication.abstract}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <span>by {publication.primaryAuthor}</span>
                        {publication.coAuthors.length > 0 && (
                          <>
                            <span>•</span>
                            <span>+{publication.coAuthors.length} co-authors</span>
                          </>
                        )}
                        <span>•</span>
                        <span>Published {format(new Date(publication.publishedAt), 'MMM dd, yyyy')}</span>
                        {publication.category && (
                          <>
                            <span>•</span>
                            <span>{publication.category}</span>
                          </>
                        )}
                      </div>
                      
                      {publication.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {publication.keywords.slice(0, 5).map((keyword, index) => (
                            <span
                              key={index}
                              className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                          {publication.keywords.length > 5 && (
                            <span className="text-xs text-gray-500">
                              +{publication.keywords.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right text-sm text-gray-500">
                        <div>{publication.type}</div>
                        {publication.isbn && <div>ISBN: {publication.isbn}</div>}
                        {publication.doi && <div>DOI: {publication.doi}</div>}
                      </div>
                      
                      <div className="flex gap-2">
                        <Link to={`/catalog/${publication.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                        {publication.downloadUrl && (
                          <a
                            href={publication.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm">
                              Download
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {searchResult.pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-6">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(searchParams.page! - 1)}
                    disabled={!searchResult.pagination.hasPrev}
                  >
                    Previous
                  </Button>
                  
                  <span className="text-sm text-gray-600">
                    Page {searchResult.pagination.page} of {searchResult.pagination.totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(searchParams.page! + 1)}
                    disabled={!searchResult.pagination.hasNext}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Facets */}
      {searchResult?.facets && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Types */}
          {searchResult.facets.types.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Publication Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {searchResult.facets.types.map((facet) => (
                    <button
                      key={facet.type}
                      onClick={() => handleFilterChange('type', facet.type)}
                      className="flex justify-between w-full text-left text-sm hover:bg-gray-50 p-1 rounded"
                    >
                      <span>{facet.type}</span>
                      <span className="text-gray-500">({facet.count})</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Categories */}
          {searchResult.facets.categories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {searchResult.facets.categories.slice(0, 5).map((facet) => (
                    <button
                      key={facet.category}
                      onClick={() => handleFilterChange('category', facet.category)}
                      className="flex justify-between w-full text-left text-sm hover:bg-gray-50 p-1 rounded"
                    >
                      <span>{facet.category}</span>
                      <span className="text-gray-500">({facet.count})</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Years */}
          {searchResult.facets.years.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Publication Years</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {searchResult.facets.years.slice(0, 5).map((facet) => (
                    <button
                      key={facet.year}
                      onClick={() => handleFilterChange('yearFrom', facet.year)}
                      className="flex justify-between w-full text-left text-sm hover:bg-gray-50 p-1 rounded"
                    >
                      <span>{facet.year}</span>
                      <span className="text-gray-500">({facet.count})</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Authors */}
          {searchResult.facets.authors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Top Authors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {searchResult.facets.authors.slice(0, 5).map((facet) => (
                    <button
                      key={facet.authorId}
                      onClick={() => handleFilterChange('author', facet.authorName)}
                      className="flex justify-between w-full text-left text-sm hover:bg-gray-50 p-1 rounded"
                    >
                      <span className="truncate">{facet.authorName}</span>
                      <span className="text-gray-500">({facet.count})</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default CatalogSearch;