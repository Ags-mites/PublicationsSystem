import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { cn } from '../../lib/utils';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label, isActive }) => {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors",
        isActive
          ? "bg-blue-100 text-blue-700 border-r-2 border-blue-700"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      )}
    >
      <span className="w-5 h-5">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
};

const Sidebar: React.FC = () => {
  const location = useLocation();
  const user = useAppSelector(selectCurrentUser);

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-64 bg-white shadow-sm border-r min-h-screen">
      <div className="p-4">
        <nav className="space-y-2">
          <SidebarItem
            to="/dashboard"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            }
            label="Dashboard"
            isActive={isActive('/dashboard')}
          />

          <SidebarItem
            to="/publications"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            }
            label="My Publications"
            isActive={isActive('/publications')}
          />

          <SidebarItem
            to="/publications/new"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            }
            label="New Publication"
            isActive={isActive('/publications/new')}
          />

          {user?.role === 'ROLE_REVISOR' && (
            <SidebarItem
              to="/reviews"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
              label="Reviews"
              isActive={isActive('/reviews')}
            />
          )}

          {(user?.role === 'ROLE_EDITOR' || user?.role === 'ROLE_ADMIN') && (
            <SidebarItem
              to="/editorial"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              }
              label="Editorial"
              isActive={isActive('/editorial')}
            />
          )}

          <div className="border-t pt-4 mt-4">
            <SidebarItem
              to="/catalog"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              }
              label="Catalog"
              isActive={isActive('/catalog')}
            />

            <SidebarItem
              to="/notifications"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              }
              label="Notifications"
              isActive={isActive('/notifications')}
            />

            <SidebarItem
              to="/profile"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              }
              label="Profile"
              isActive={isActive('/profile')}
            />

            <SidebarItem
              to="/settings"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              }
              label="Settings"
              isActive={isActive('/settings')}
            />
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;