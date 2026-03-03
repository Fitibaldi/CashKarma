import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { GroupDetailsPage } from './pages/GroupDetailsPage';
import { InvitePage } from './pages/InvitePage';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // After login, redirect back to any saved invite URL
  useEffect(() => {
    if (user) {
      const redirectUrl = sessionStorage.getItem('inviteRedirect');
      if (redirectUrl) {
        sessionStorage.removeItem('inviteRedirect');
        navigate(redirectUrl);
      }
    }
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow invite page even when not logged in
  if (!user) {
    return (
      <Routes>
        <Route path="/invite/:groupId" element={<InvitePage />} />
        <Route path="*" element={<AuthPage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/group/:groupId" element={<GroupDetailsPage />} />
      <Route path="/invite/:groupId" element={<InvitePage />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationsProvider>
          <AppContent />
        </NotificationsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
