import React, { useRef, useState } from 'react';
import { Plus, Bell, Search, Euro, LogIn } from 'lucide-react';
import { User } from '../types/auth';
import { useNotifications } from '../contexts/NotificationsContext';
import { NotificationPanel } from './NotificationPanel';

interface HeaderProps {
  onCreateGroup: () => void;
  onJoinGroup?: () => void;
  onProfileClick: () => void;
  user?: User | null;
}

export const Header: React.FC<HeaderProps> = ({
  onCreateGroup,
  onJoinGroup,
  onProfileClick,
  user
}) => {
  const { unreadCount } = useNotifications();
  const [panelOpen, setPanelOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : '?';

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Euro className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">SplitShare</h1>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-4 sm:mx-8 hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search groups..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={onJoinGroup}
              className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-2 sm:px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Join Group</span>
            </button>
            <button
              onClick={onCreateGroup}
              className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Group</span>
            </button>

            {/* Notification bell — positioned relative so the panel anchors here */}
            <div className="relative">
              <button
                ref={bellRef}
                onClick={() => setPanelOpen(prev => !prev)}
                className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <NotificationPanel
                isOpen={panelOpen}
                onClose={() => setPanelOpen(false)}
                anchorRef={bellRef}
              />
            </div>

            <button
              onClick={onProfileClick}
              className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center hover:ring-2 hover:ring-blue-400 transition-all"
              title="Your profile"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-sm font-semibold">{initials}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
