// Accounts.jsx
import React, { useState, useEffect } from 'react';
import { PlusCircle, RefreshCw, Trash2 } from 'lucide-react';
import { usePlaidLink } from '../hooks/usePlaidLink';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import PlaidAPI from '../api/plaidApi';
import FintrackAPI from '../api/fintrackApi';

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const onPlaidSuccess = async () => {
    await fetchAccounts();
  };

  const { open: openPlaid, ready: plaidReady } = usePlaidLink(onPlaidSuccess);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await FintrackAPI.getAccounts();
      setAccounts(response);
      setError(null);
    } catch (err) {
      setError('Failed to load accounts');
      console.error('Accounts fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const refreshAccount = async (accountId) => {
    try {
      setRefreshing(true);
      await PlaidAPI.refreshTransactions();
      await fetchAccounts();
    } catch (err) {
      setError('Failed to refresh account');
      console.error('Account refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const unlinkAccount = async (accountId) => {
    if (!window.confirm('Are you sure you want to unlink this account?')) return;

    try {
      setLoading(true);
      await PlaidAPI.unlinkAccount(accountId);
      await fetchAccounts();
    } catch (err) {
      setError('Failed to unlink account');
      console.error('Account unlink error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Connected Accounts</h1>
        <Button
          onClick={openPlaid}
          disabled={!plaidReady}
          variant="primary"
          icon={<PlusCircle className="w-4 h-4" />}
        >
          Add Account
        </Button>
      </div>

      {error && (
        <div className="mb-8 bg-red-50 p-4 rounded-md text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <Card
            key={account.id}
            className="hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {account.name}
                </h3>
                <p className="text-sm text-gray-500">{account.institution}</p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshAccount(account.id)}
                  disabled={refreshing}
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Refresh
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => unlinkAccount(account.id)}
                  icon={<Trash2 className="w-4 h-4" />}
                >
                  Unlink
                </Button>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(account.balance)}
              </p>
              <p className="text-sm text-gray-500">Current Balance</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Account Type</p>
                  <p className="font-medium text-gray-900">{account.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium text-gray-900">
                    {new Date(account.lastUpdated).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {accounts.length === 0 && (
        <Card className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            No Connected Accounts
          </h2>
          <p className="text-gray-500 mb-8">
            Connect your bank accounts to start tracking your finances.
          </p>
          <Button
            onClick={openPlaid}
            disabled={!plaidReady}
            variant="primary"
            icon={<PlusCircle className="w-4 h-4" />}
          >
            Connect Account
          </Button>
        </Card>
      )}
    </div>
  );
};

export default Accounts;