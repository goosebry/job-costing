import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { AppShell } from './components/AppShell';
import { OnboardingWizard } from './components/OnboardingWizard';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { JobsPage } from './pages/JobsPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { CreateJobPage } from './pages/CreateJobPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { DashboardPage } from './pages/DashboardPage';
import { CostsPage } from './pages/CostsPage';
import { LaborPage } from './pages/LaborPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { ChangeOrdersPage } from './pages/ChangeOrdersPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ClientsPage } from './pages/ClientsPage';
import { ClientDetailPage } from './pages/ClientDetailPage';
import api from './services/api';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    // Check if already dismissed in this browser session
    if (localStorage.getItem('onboarding_complete') === 'true') {
      setShowOnboarding(false);
      return;
    }
    api.get('/onboarding/status').then(r => {
      setShowOnboarding(!r.data.complete);
    }).catch(() => setShowOnboarding(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // Still checking — render nothing briefly to avoid flash
  if (showOnboarding === null) return null;

  return (
    <>
      {showOnboarding && (
        <OnboardingWizard onComplete={() => {
          localStorage.setItem('onboarding_complete', 'true');
          setShowOnboarding(false);
        }} />
      )}
      {children}
    </>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/jobs" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/jobs" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="jobs/new" element={<CreateJobPage />} />
        <Route path="jobs/:id" element={<JobDetailPage />} />
        <Route path="costs" element={<CostsPage />} />
        <Route path="costs/new" element={<CostsPage />} />
        <Route path="labor" element={<LaborPage />} />
        <Route path="labor/new" element={<LaborPage />} />
        <Route path="budgets" element={<BudgetsPage />} />
        <Route path="change-orders" element={<ChangeOrdersPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="approvals" element={<ApprovalsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:id" element={<ClientDetailPage />} />
        <Route path="settings/*" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}