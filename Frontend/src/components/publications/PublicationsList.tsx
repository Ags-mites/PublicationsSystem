import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useGetMyPublicationsQuery } from '../../store/api/publicationsApi';
import { useAppSelector } from '../../store';
import { PublicationStatus, PublicationType } from '../../types/api';
import { format } from 'date-fns';

const PublicationsList: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const { data: publications, isLoading, error } = useGetMyPublicationsQuery({
    primaryAuthorId: user?.id,
    page: 1,
    limit: 20,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case PublicationStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case PublicationStatus.IN_REVIEW:
        return 'bg-yellow-100 text-yellow-800';
      case PublicationStatus.CHANGES_REQUESTED:
        return 'bg-orange-100 text-orange-800';
      case PublicationStatus.APPROVED:
        return 'bg-blue-100 text-blue-800';
      case PublicationStatus.PUBLISHED:
        return 'bg-green-100 text-green-800';
      case PublicationStatus.WITHDRAWN:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Publications</CardTitle>
          <CardDescription>Loading your publications...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Publications</CardTitle>
          <CardDescription>Error loading publications</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">
            Failed to load publications. Please try again.
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Publications</CardTitle>
          <CardDescription>
            Manage your research publications
          </CardDescription>
        </div>
        <Link to="/publications/new">
          <Button>New Publication</Button>
        </Link>
      </CardHeader>
      <CardContent>
        {!publications || publications.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              No publications found. Start by creating your first publication.
            </p>
            <Link to="/publications/new">
              <Button>Create Publication</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {publications.map((publication) => (
              <div
                key={publication.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getTypeIcon(publication.type)}</span>
                      <Link
                        to={`/publications/${publication.id}`}
                        className="text-lg font-semibold hover:text-blue-600 transition-colors"
                      >
                        {publication.title}
                      </Link>
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {publication.abstract}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Version {publication.currentVersion}</span>
                      <span>•</span>
                      <span>Created {format(new Date(publication.createdAt), 'MMM dd, yyyy')}</span>
                      {publication.publishedAt && (
                        <>
                          <span>•</span>
                          <span>Published {format(new Date(publication.publishedAt), 'MMM dd, yyyy')}</span>
                        </>
                      )}
                    </div>
                    
                    {publication.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {publication.keywords.slice(0, 3).map((keyword, index) => (
                          <span
                            key={index}
                            className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                          >
                            {keyword}
                          </span>
                        ))}
                        {publication.keywords.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{publication.keywords.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        publication.status
                      )}`}
                    >
                      {publication.status.replace('_', ' ')}
                    </span>
                    
                    <div className="flex gap-2">
                      <Link to={`/publications/${publication.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                      {publication.status === PublicationStatus.DRAFT && (
                        <Link to={`/publications/${publication.id}/edit`}>
                          <Button size="sm">
                            Edit
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PublicationsList;