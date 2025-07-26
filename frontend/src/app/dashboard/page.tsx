'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import ProtectedRoute from '@/components/ProtectedRoute';
import EmployeeDashboard from '@/components/dashboards/EmployeeDashboard';
import SecurityTeamDashboard from '@/components/dashboards/SecurityTeamDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';

export default function DashboardPage() {
  const { userProfile } = useSelector((state: RootState) => state.auth);

  const renderDashboard = () => {
    switch (userProfile?.role) {
      case 'employee':
        return <EmployeeDashboard />;
      case 'security_team':
        return <SecurityTeamDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <EmployeeDashboard />;
    }
  };

  return (
    <ProtectedRoute>
      {renderDashboard()}
    </ProtectedRoute>
  );
}