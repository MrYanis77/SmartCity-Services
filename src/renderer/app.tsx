import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Toaster } from '@/components/ui/toast';

import Index from '@/pages/Index';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ReportPage from '@/pages/ReportPage';
import MyReportsPage from '@/pages/MyReportsPage';
import AgentTasksPage from '@/pages/AgentTasksPage';
import SignalementsPage from '@/pages/SignalementsPage';
import StatsPage from '@/pages/StatsPage';
import AdminPage from '@/pages/AdminPage';
import ResponsablePage from '@/pages/ResponsablePage';
import NotFound from '@/pages/NotFound';

/** Route protégée : redirige vers / si non connecté */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/**
 * Route avec contrôle de rôle.
 * Redirige vers /dashboard si le rôle de l'utilisateur n'est pas autorisé.
 */
function RoleRoute({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/dashboard" element={
        <ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>
      } />

      <Route path="/report" element={
        <ProtectedRoute><Layout><ReportPage /></Layout></ProtectedRoute>
      } />

      <Route path="/my-reports" element={
        <ProtectedRoute><Layout><MyReportsPage /></Layout></ProtectedRoute>
      } />

      <Route path="/agent-tasks" element={
        <ProtectedRoute><Layout><AgentTasksPage /></Layout></ProtectedRoute>
      } />

      <Route path="/signalements" element={
        <RoleRoute roles={['responsable', 'admin']}><Layout><SignalementsPage /></Layout></RoleRoute>
      } />

      <Route path="/stats" element={
        <RoleRoute roles={['responsable', 'admin']}><Layout><StatsPage /></Layout></RoleRoute>
      } />

      <Route path="/responsable" element={
        <RoleRoute roles={['responsable']}><Layout><ResponsablePage /></Layout></RoleRoute>
      } />

      <Route path="/admin" element={
        <RoleRoute roles={['admin']}><Layout><AdminPage /></Layout></RoleRoute>
      } />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}
