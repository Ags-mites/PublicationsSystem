import React from 'react';
import ReviewsList from '../components/reviews/ReviewsList';

const ReviewsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          My Reviews
        </h1>
        <p className="text-gray-600">
          Review publications assigned to you and track their progress
        </p>
      </div>
      <ReviewsList />
    </div>
  );
};

export default ReviewsPage;