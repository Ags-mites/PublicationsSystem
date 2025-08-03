import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const EditorialDashboard: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Editorial Dashboard</CardTitle>
        <CardDescription>
          Manage publications and editorial decisions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          Editorial dashboard functionality will be implemented here.
        </p>
      </CardContent>
    </Card>
  );
};

export default EditorialDashboard;