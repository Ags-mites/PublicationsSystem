import React from 'react';
import UserProfile from '../components/auth/UserProfile';

const ProfilePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          User Profile
        </h1>
        <p className="text-gray-600">
          Manage your account information and preferences
        </p>
      </div>
      <UserProfile />
    </div>
  );
};

export default ProfilePage;