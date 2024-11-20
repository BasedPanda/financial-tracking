// BudgetProgress.jsx
import React from 'react';
import Card from '../../common/Card';

const BudgetProgress = ({ budgets = [] }) => {
  const calculateProgress = (spent, limit) => {
    const percentage = (spent / limit) * 100;
    return Math.min(percentage, 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card
      title="Budget Overview"
      subtitle="Monthly Budget Progress"
      className="h-full"
    >
      <div className="space-y-4">
        {budgets.map((budget) => {
          const progress = calculateProgress(budget.spent, budget.limit);
          const progressColor = getProgressColor(progress);

          return (
            <div key={budget.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{budget.category}</p>
                  <p className="text-sm text-gray-500">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(budget.spent)}
                    {' of '}
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(budget.limit)}
                  </p>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {progress.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${progressColor}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default BudgetProgress;