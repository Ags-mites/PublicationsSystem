import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface ReviewDetailProps {
  reviewId: string;
}

const ReviewDetail: React.FC<ReviewDetailProps> = ({ reviewId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Detail</CardTitle>
        <CardDescription>
          Reviewing publication {reviewId}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          Review details and form will be displayed here.
        </p>
      </CardContent>
    </Card>
  );
};

export default ReviewDetail;