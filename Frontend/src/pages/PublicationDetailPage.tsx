import React from 'react';
import { useParams } from 'react-router-dom';
import CatalogPublicationDetail from '../components/catalog/CatalogPublicationDetail';

const PublicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-semibold text-gray-900">
          Publication not found
        </h1>
        <p className="text-gray-600 mt-2">
          The publication you're looking for doesn't exist.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CatalogPublicationDetail publicationId={id} />
    </div>
  );
};

export default PublicationDetailPage;