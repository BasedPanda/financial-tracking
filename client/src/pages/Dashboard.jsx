// Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePlaidLink } from '../hooks/usePlaidLink';
import AccountSummary from '../components/dashboard/AccountSummary';
import BudgetProgress from '../components/dashboard/BudgetProgress';
import ExpenseChart from '../components/dashboard/ExpenseChart';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import FintrackAPI from '../api/fintrackApi';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const onPlaidSuccess = async (result) => {
    await fetchDashboardData();
  };

  const { open: openPlaid, ready: plaidReady } = usePlaidLink(onPlaidSuccess);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [accounts, budgets, expenses] = await Promise.all([
        FintrackAPI.getAccounts(),
        FintrackAPI.getBudgets(),
        FintrackAPI.getSpendingTrends({ period: 'monthly' })
      ]);

      setDashboardData({ accounts, budgets, expenses });
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <Loading fullScreen />;
  }

  if (error) {
    return (
      <Card className="m-4">
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Dashboard
          </h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>Retry</Button>
        </div>
      </Card>
    );
  }

  const hasAccounts = dashboardData?.accounts?.length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.name}
        </h1>
        {!hasAccounts && (
          <Button
            onClick={openPlaid}
            disabled={!plaidReady}
            variant="primary"
          >
            Connect Bank Account
          </Button>
        )}
      </div>

      {hasAccounts ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <AccountSummary accounts={dashboardData.accounts} />
          </div>
          <div>
            <BudgetProgress budgets={dashboardData.budgets} />
          </div>
          <div className="lg:col-span-3">
            <ExpenseChart expenses={dashboardData.expenses} />
          </div>
        </div>
      ) : (
        <Card className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Get Started with FinTrack
          </h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Connect your bank account to start tracking your finances and get
            personalized insights about your spending habits.
          </p>
          <div className="space-x-4">
            <Button
              onClick={openPlaid}
              disabled={!plaidReady}
              variant="primary"
            >
              Connect Bank Account
            </Button>
            <Button
              onClick={() => navigate('/transactions')}
              variant="outline"
            >
              Manual Entry
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;