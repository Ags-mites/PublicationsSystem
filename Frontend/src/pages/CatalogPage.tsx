import React from 'react';
import CatalogSearch from '../components/catalog/CatalogSearch';

const CatalogPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Publications Catalog
        </h1>
        <p className="text-gray-600">
          Discover and explore published academic works
        </p>
      </div>
      <CatalogSearch />
    </div>
  );
};

export default CatalogPage;