import React from 'react';
import { useParams } from 'react-router-dom';
import PublicationForm from '../components/publications/PublicationForm';

const EditPublicationPage: React.FC = () => {
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Edit Publication
        </h1>
        <p className="text-gray-600">
          Make changes to your publication (only available for draft publications)
        </p>
      </div>
      <PublicationForm mode="edit" publicationId={id} />
    </div>
  );
};

export default EditPublicationPage;