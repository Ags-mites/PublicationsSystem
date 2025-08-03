import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface PublicationDetailProps {
  publicationId: string;
}

const PublicationDetail: React.FC<PublicationDetailProps> = ({ publicationId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Publication Detail</CardTitle>
        <CardDescription>
          Viewing publication {publicationId}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          Publication details will be displayed here.
        </p>
      </CardContent>
    </Card>
  );
};

export default PublicationDetail;