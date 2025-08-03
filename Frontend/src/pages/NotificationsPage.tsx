import React from 'react';
import NotificationCenter from '../components/notifications/NotificationCenter';

const NotificationsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Notifications
        </h1>
        <p className="text-gray-600">
          Stay updated with your publications and reviews
        </p>
      </div>
      <NotificationCenter />
    </div>
  );
};

export default NotificationsPage;