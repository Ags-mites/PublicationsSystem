import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const UserProfile: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
        <CardDescription>
          Manage your account information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          User profile management will be implemented here.
        </p>
      </CardContent>
    </Card>
  );
};

export default UserProfile;