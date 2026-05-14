import { useAuth } from '../hooks/useAuth';
import { DashboardContent } from '../components/dashboard/DashboardContent';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user?.firstName} {user?.lastName}</p>
      </div>
      <DashboardContent />
    </div>
  );
}