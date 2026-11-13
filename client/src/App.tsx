import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { NetworkProvider } from './context/NetworkContext.js';
import { Layout } from './components/layout/Layout.js';
import { LandingPage } from './pages/LandingPage.js';
import { FieldWorkerDashboard } from './pages/FieldWorkerDashboard.js';
import { CoordinatorDashboard } from './pages/CoordinatorDashboard.js';
import { CreateReportPage } from './pages/CreateReportPage.js';
import { ReportListPage } from './pages/ReportListPage.js';
import { ReportDetailPage } from './pages/ReportDetailPage.js';
import { ActivityHistoryPage } from './pages/ActivityHistoryPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

const DynamicDashboard: React.FC = () => {
  const { isCoordinator } = useAuth();
  return isCoordinator ? <CoordinatorDashboard /> : <FieldWorkerDashboard />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NetworkProvider>
          <Routes>
            {/* Landing / Welcome Screen */}
            <Route path="/" element={<LandingPage />} />

            {/* App Layout Shell */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DynamicDashboard />} />
              <Route path="/reports" element={<ReportListPage />} />
              <Route path="/reports/create" element={<CreateReportPage />} />
              <Route path="/reports/:id" element={<ReportDetailPage />} />
              <Route path="/activities" element={<ActivityHistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NetworkProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

