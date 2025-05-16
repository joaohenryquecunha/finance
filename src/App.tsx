import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { InstallPWA } from './components/InstallPWA';
import { RenewalModal } from './components/RenewalModal';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { Dashboard } from './pages/Dashboard';
import { Goals } from './pages/Goals';
import { Companies } from './pages/Companies';
import { setupAdminUser } from './lib/firebase';
import { differenceInDays, parseISO } from 'date-fns';

function App() {
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [lastRenewalPrompt, setLastRenewalPrompt] = useState<string | null>(
    localStorage.getItem('lastRenewalPrompt')
  );

  useEffect(() => {
    setupAdminUser();
  }, []);

  useEffect(() => {
    const checkAccessExpiration = () => {
      const user = JSON.parse(localStorage.getItem('jf_user') || '{}');
      
      if (user?.trialExpiresAt) {
        const daysRemaining = differenceInDays(parseISO(user.trialExpiresAt), new Date());
        const today = new Date().toISOString().split('T')[0];

        if (daysRemaining <= 3 && lastRenewalPrompt !== today) {
          setShowRenewalModal(true);
          setLastRenewalPrompt(today);
          localStorage.setItem('lastRenewalPrompt', today);
        }
      }
    };

    checkAccessExpiration();
  }, [lastRenewalPrompt]);

  return (
    <BrowserRouter>
      <AuthProvider>
        <InstallPWA />
        {showRenewalModal && (
          <RenewalModal
            onClose={() => setShowRenewalModal(false)}
            daysRemaining={3}
          />
        )}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/goals"
            element={
              <PrivateRoute>
                <Goals />
              </PrivateRoute>
            }
          />
          <Route
            path="/companies"
            element={
              <PrivateRoute>
                <Companies />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute requireAdmin>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;