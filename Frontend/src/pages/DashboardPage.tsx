import React from 'react';
import { useAppSelector } from '../store';
import { selectCurrentUser } from '../store/slices/authSlice';
import Dashboard from '../components/dashboard/Dashboard';

const DashboardPage: React.FC = () => {
  const user = useAppSelector(selectCurrentUser);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your publications today.
        </p>
      </div>
      <Dashboard />
    </div>
  );
};

export default DashboardPage;