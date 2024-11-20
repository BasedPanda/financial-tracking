// AccountSummary.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../../common/Card';

const AccountSummary = ({ accounts = [] }) => {
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(totalBalance);

  // Last 7 days balance history
  const balanceHistory = accounts[0]?.balanceHistory || [];

  return (
    <Card
      title="Account Summary"
      subtitle="Total Balance Across All Accounts"
      className="h-full"
    >
      <div className="space-y-6">
        <div className="text-center">
          <h4 className="text-2xl font-bold text-gray-700">{formattedBalance}</h4>
          <p className="text-sm text-gray-500">Total Balance</p>
        </div>

        <div className="space-y-4">
          {accounts.map((account) => (
            <div key={account.id} className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">{account.name}</p>
                <p className="text-sm text-gray-500">{account.type}</p>
              </div>
              <p className="font-medium text-gray-900">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(account.balance)}
              </p>
            </div>
          ))}
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={balanceHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
};

export default AccountSummary;