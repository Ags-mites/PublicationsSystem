import React from 'react';
import PublicationsList from '../components/publications/PublicationsList';

const PublicationsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            My Publications
          </h1>
          <p className="text-gray-600">
            Manage your research publications and track their progress
          </p>
        </div>
      </div>
      <PublicationsList />
    </div>
  );
};

export default PublicationsPage;