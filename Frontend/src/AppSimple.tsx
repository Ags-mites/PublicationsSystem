import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { store, useAppSelector, selectIsAuthenticated } from './store/simple';

// Simple components
const SimpleLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Academic Publications</h1>
          {isAuthenticated && (
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Logout
            </button>
          )}
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

const LoginPage: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login
    const mockUser = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: email,
      roles: ['ROLE_AUTHOR'],
      emailVerified: true,
      createdAt: new Date().toISOString(),
    };
    
    localStorage.setItem('accessToken', 'mock-token');
    localStorage.setItem('user', JSON.stringify(mockUser));
    window.location.reload();
  };

  return (
    <SimpleLayout>
      <div className="max-w-md mx-auto">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Sign In</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </SimpleLayout>
  );
};

const DashboardPage: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  
  return (
    <SimpleLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">
          Welcome, {user?.firstName}!
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">My Publications</h3>
            <p className="text-3xl font-bold text-blue-600">0</p>
            <p className="text-gray-600">Total publications</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">In Review</h3>
            <p className="text-3xl font-bold text-yellow-600">0</p>
            <p className="text-gray-600">Under review</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Published</h3>
            <p className="text-3xl font-bold text-green-600">0</p>
            <p className="text-gray-600">Successfully published</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-x-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              New Publication
            </button>
            <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
              Browse Catalog
            </button>
          </div>
        </div>
      </div>
    </SimpleLayout>
  );
};

const CatalogPage: React.FC = () => {
  return (
    <SimpleLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Publications Catalog</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search publications..."
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>
          
          <div className="text-center py-12 text-gray-500">
            <p>No publications found.</p>
            <p>Start by creating your first publication!</p>
          </div>
        </div>
      </div>
    </SimpleLayout>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AppSimple: React.FC = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          
          {/* Default redirect */}
          <Route
            path="/"
            element={
              <Navigate to="/catalog" replace />
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </Provider>
  );
};

export default AppSimple;