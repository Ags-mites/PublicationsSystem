import React from 'react';
import UserSettings from '../components/settings/UserSettings';

const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Settings
        </h1>
        <p className="text-gray-600">
          Customize your experience and manage preferences
        </p>
      </div>
      <UserSettings />
    </div>
  );
};

export default SettingsPage;