import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const ReviewsList: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Reviews</CardTitle>
        <CardDescription>
          Publications assigned for review
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          No reviews assigned at the moment.
        </p>
      </CardContent>
    </Card>
  );
};

export default ReviewsList;