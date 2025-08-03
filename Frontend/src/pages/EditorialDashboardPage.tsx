import React from 'react';
import EditorialDashboard from '../components/dashboard/EditorialDashboard';

const EditorialDashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Editorial Dashboard
        </h1>
        <p className="text-gray-600">
          Manage publications, reviews, and editorial decisions
        </p>
      </div>
      <EditorialDashboard />
    </div>
  );
};

export default EditorialDashboardPage;