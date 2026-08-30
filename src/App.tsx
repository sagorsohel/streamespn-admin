import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SportsPage } from './pages/SportsPage';
import { SubcategoriesPage } from './pages/SubcategoriesPage';
import { MatchesPage } from './pages/MatchesPage';
import { AdsControlPage } from './pages/AdsControlPage';
import { AdminLayout } from './components/layout/AdminLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors theme="dark" closeButton />
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Admin Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/sports" element={<SportsPage />} />
          <Route path="/subcategories" element={<SubcategoriesPage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/ads" element={<AdsControlPage />} />
        </Route>

        {/* Fallback Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
