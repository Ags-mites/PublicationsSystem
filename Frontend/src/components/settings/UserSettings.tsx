import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const UserSettings: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>
          Customize your experience and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          User settings will be implemented here.
        </p>
      </CardContent>
    </Card>
  );
};

export default UserSettings;