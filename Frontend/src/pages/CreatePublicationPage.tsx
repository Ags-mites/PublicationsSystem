import React from 'react';
import PublicationForm from '../components/publications/PublicationForm';

const CreatePublicationPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Create New Publication
        </h1>
        <p className="text-gray-600">
          Submit your research work for review and publication
        </p>
      </div>
      <PublicationForm mode="create" />
    </div>
  );
};

export default CreatePublicationPage;