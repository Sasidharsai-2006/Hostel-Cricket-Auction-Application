import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuctionProvider } from './context/AuctionContext';
import { Navbar } from './components/Navbar';
import { Toast } from './components/Toast';

// Pages
import { LoginPage } from './pages/LoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminAuctionControlPage } from './pages/AdminAuctionControlPage';
import { AdminPlayersPage } from './pages/AdminPlayersPage';
import { AdminTeamsPage } from './pages/AdminTeamsPage';
import { AdminHistoryPage } from './pages/AdminHistoryPage';
import { AdminAnalyticsPage } from './pages/AdminAnalyticsPage';
import { CaptainDashboardPage } from './pages/CaptainDashboardPage';
import { CaptainSquadPage } from './pages/CaptainSquadPage';
import { LiveProjectorPage } from './pages/LiveProjectorPage';

// Protected Route wrappers
const ProtectedAdminRoute: React.FC = () => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/captain" replace />;
  return (
    <div className="min-h-screen flex flex-col bg-[#090D16]">
      <Navbar />
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        <Outlet />
      </div>
      <Toast />
    </div>
  );
};

const ProtectedCaptainRoute: React.FC = () => {
  const { user, loading, isCaptain } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isCaptain) return <Navigate to="/admin" replace />;
  return (
    <div className="min-h-screen flex flex-col bg-[#090D16]">
      <Navbar />
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        <Outlet />
      </div>
      <Toast />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuctionProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Standalone Fullscreen Projector / LED Screen */}
            <Route path="/live" element={<LiveProjectorPage />} />

            {/* Admin Panel Routes */}
            <Route path="/admin" element={<ProtectedAdminRoute />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="auction" element={<AdminAuctionControlPage />} />
              <Route path="players" element={<AdminPlayersPage />} />
              <Route path="teams" element={<AdminTeamsPage />} />
              <Route path="history" element={<AdminHistoryPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
            </Route>

            {/* Captain Panel Routes */}
            <Route path="/captain" element={<ProtectedCaptainRoute />}>
              <Route index element={<CaptainDashboardPage />} />
              <Route path="auction" element={<CaptainDashboardPage />} />
              <Route path="squad" element={<CaptainSquadPage />} />
            </Route>

            {/* Default Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuctionProvider>
    </AuthProvider>
  );
};

export default App;
