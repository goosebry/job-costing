import { useQuery } from '@tanstack/react-query';
import { budgetApi } from '../services/api';

export function BudgetsPage() {
  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => budgetApi.getAll(),
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Budgets</h1>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading budgets...</div>
      ) : budgets && budgets.length > 0 ? (
        <div className="grid gap-6">
          {budgets.map((budget: any) => {
            const variance = budget.actual - budget.estimated;
            const variancePercent = budget.estimated > 0 ? (variance / budget.estimated) * 100 : 0;
            const statusColor = variancePercent <= 0 ? 'text-green-600' : variancePercent <= 10 ? 'text-yellow-600' : 'text-red-600';

            return (
              <div key={budget.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{budget.job?.name}</h3>
                    <p className="text-sm text-gray-500">{budget.category?.name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    variancePercent <= 0 ? 'bg-green-100 text-green-800' :
                    variancePercent <= 10 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {variancePercent <= 0 ? 'Under Budget' : variancePercent <= 10 ? 'Near Limit' : 'Over Budget'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Estimated</p>
                    <p className="text-xl font-semibold text-gray-900">${budget.estimated.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Actual</p>
                    <p className="text-xl font-semibold text-gray-900">${budget.actual.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Variance</p>
                    <p className={`text-xl font-semibold ${statusColor}`}>
                      {variance >= 0 ? '+' : ''}{variance.toLocaleString()} ({variancePercent.toFixed(1)}%)
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        variancePercent <= 0 ? 'bg-green-500' :
                        variancePercent <= 10 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, (budget.actual / budget.estimated) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No budgets configured yet</p>
        </div>
      )}
    </div>
  );
}