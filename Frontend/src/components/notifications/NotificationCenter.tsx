import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const NotificationCenter: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Stay updated with your publications and reviews
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          Notification center will be implemented here.
        </p>
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;