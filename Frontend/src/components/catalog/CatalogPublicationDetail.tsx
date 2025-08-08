import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useGetCatalogPublicationQuery } from '../../store/api/catalogApi';
import { PublicationType } from '../../types/api';

interface CatalogPublicationDetailProps {
  publicationId: string;
}

const CatalogPublicationDetail: React.FC<CatalogPublicationDetailProps> = ({ publicationId }) => {
  const { data, isLoading, error, refetch } = useGetCatalogPublicationQuery(publicationId);

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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Publication</CardTitle>
          <CardDescription>Loading publication details...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Publication</CardTitle>
          <CardDescription>Error loading publication</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">We couldn't load this publication.</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{getTypeIcon(data.type)}</span>
            <div>
              <CardTitle>{data.title}</CardTitle>
              <CardDescription>
                {data.primaryAuthor.fullName}
                {data.coAuthors.length > 0 && ` · +${data.coAuthors.length} co-authors`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-700 whitespace-pre-line">{data.abstract}</p>

            <div className="flex flex-wrap gap-2">
              {data.keywords.map((k, i) => (
                <span key={i} className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                  {k}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              {data.doi && (
                <div><span className="font-medium">DOI:</span> {data.doi}</div>
              )}
              {data.isbn && (
                <div><span className="font-medium">ISBN:</span> {data.isbn}</div>
              )}
              <div><span className="font-medium">Category:</span> {data.category}</div>
              <div><span className="font-medium">Published:</span> {new Date(data.publishedAt).toLocaleDateString()}</div>
              <div><span className="font-medium">License:</span> {data.license}</div>
            </div>

            {data.downloadUrl && (
              <div>
                <a href={data.downloadUrl} target="_blank" rel="noopener noreferrer">
                  <Button>Download</Button>
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {data.relatedPublications?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Related Publications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.relatedPublications.map((p) => (
                <div key={p.id} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{getTypeIcon(p.type)}</span>
                    <span className="font-medium truncate" title={p.title}>{p.title}</span>
                  </div>
                  <div className="text-xs text-gray-500">{p.primaryAuthor}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CatalogPublicationDetail;


