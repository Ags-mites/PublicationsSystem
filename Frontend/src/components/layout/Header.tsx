import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { useAppSelector, useAppDispatch } from '../../store';
import { 
  selectIsAuthenticated, 
  selectCurrentUser,
  logout 
} from '../../store/slices/authSlice';
import { useLogoutMutation } from '../../store/api/authApi';
import { toast } from 'sonner';

const Header: React.FC = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const [logoutMutation] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch (error) {
      // Even if the API call fails, we still want to log out locally
      console.warn('Logout API call failed:', error);
    } finally {
      dispatch(logout());
      toast.success('Logged out successfully');
      navigate('/');
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AP</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">
                Academic Publications
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/catalog"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Catalog
            </Link>
            
            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/publications"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  My Publications
                </Link>
                {user?.roles.includes('ROLE_REVIEWER' as any) && (
                  <Link
                    to="/reviews"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Reviews
                  </Link>
                )}
                {(user?.roles.includes('ROLE_EDITOR' as any) || user?.roles.includes('ROLE_ADMIN' as any)) && (
                  <Link
                    to="/editorial"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Editorial
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/notifications"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-5 5v-5z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4"
                    />
                  </svg>
                </Link>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;