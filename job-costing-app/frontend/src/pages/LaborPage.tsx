import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { laborApi } from '../services/api';

export function LaborPage() {
  const { data: labor, isLoading } = useQuery({
    queryKey: ['labor'],
    queryFn: () => laborApi.getAll(),
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Labor Entries</h1>
        <Link
          to="/labor/new"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Add Labor Entry
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading labor entries...</div>
      ) : labor && labor.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours Worked</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours Travel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {labor.map((entry: any) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{entry.job?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{entry.user?.firstName} {entry.user?.lastName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(entry.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{entry.hoursWorked}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{entry.hoursTravel}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{entry.hoursWorked + entry.hoursTravel}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">${entry.hourlyRate?.toFixed(2) || '-'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">${entry.total?.toFixed(2) || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">No labor entries found</p>
          <Link
            to="/labor/new"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Create your first labor entry
          </Link>
        </div>
      )}
    </div>
  );
}