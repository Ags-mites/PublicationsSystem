import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
// import ErrorBoundary from './components/common/ErrorBoundary';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CatalogPage from './pages/CatalogPage';
import PublicationsPage from './pages/PublicationsPage';
import CreatePublicationPage from './pages/CreatePublicationPage';
import PublicationDetailPage from './pages/PublicationDetailPage';
import EditPublicationPage from './pages/EditPublicationPage';
import ReviewsPage from './pages/ReviewsPage';
import ReviewDetailPage from './pages/ReviewDetailPage';
import EditorialDashboardPage from './pages/EditorialDashboardPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

const router = createBrowserRouter([
  // Public routes
  {
    path: '/',
    element: <Layout />,
    // errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <CatalogPage />,
      },
      {
        path: 'catalog',
        element: <CatalogPage />,
      },
      {
        path: 'catalog/:id',
        element: <PublicationDetailPage />,
      },
    ],
  },
  
  // Auth routes (no layout)
  {
    path: '/login',
    element: <LoginPage />,
    // errorElement: <ErrorBoundary />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
    // errorElement: <ErrorBoundary />,
  },

  // Protected routes
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    // errorElement: <ErrorBoundary />,
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'publications',
        element: <PublicationsPage />,
      },
      {
        path: 'publications/new',
        element: <CreatePublicationPage />,
      },
      {
        path: 'publications/:id',
        element: <PublicationDetailPage />,
      },
      {
        path: 'publications/:id/edit',
        element: (
          <ProtectedRoute>
            <EditPublicationPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reviews',
        element: (
          <ProtectedRoute requiredRoles={['ROLE_REVISOR', 'ROLE_EDITOR', 'ROLE_ADMIN']}>
            <ReviewsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reviews/:id',
        element: (
          <ProtectedRoute requiredRoles={['ROLE_REVISOR', 'ROLE_EDITOR', 'ROLE_ADMIN']}>
            <ReviewDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'editorial',
        element: (
          <ProtectedRoute requiredRoles={['ROLE_EDITOR', 'ROLE_ADMIN']}>
            <EditorialDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },

  // 404 route
  {
    path: '*',
    element: <NotFoundPage />,
    // errorElement: <ErrorBoundary />,
  },
]);

const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;