// Transactions.jsx
import React, { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import { Filter, Download, Plus } from 'lucide-react';

const Transactions = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [filterForm, setFilterForm] = useState({
    startDate: '',
    endDate: '',
    category: '',
    minAmount: '',
    maxAmount: '',
  });

  const {
    transactions,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    goToPage,
    statistics,
    groupedTransactions,
  } = useTransactions();

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    updateFilters(filterForm);
  };

  const exportTransactions = () => {
    const csv = transactions.map(t => 
      `${t.date},${t.description},${t.amount},${t.category}`
    ).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading && !transactions.length) {
    return <Loading fullScreen />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <div className="flex space-x-4">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            icon={<Filter className="w-4 h-4" />}
          >
            Filter
          </Button>
          <Button
            variant="outline"
            onClick={exportTransactions}
            icon={<Download className="w-4 h-4" />}
          >
            Export
          </Button>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
          >
            Add Transaction
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-8 bg-red-50 p-4 rounded-md text-red-800">
          {error}
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-8">
          <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <input
                  type="date"
                  value={filterForm.startDate}
                  onChange={(e) => setFilterForm({ ...filterForm, startDate: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={filterForm.endDate}
                  onChange={(e) => setFilterForm({ ...filterForm, endDate: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={filterForm.category}
                onChange={(e) => setFilterForm({ ...filterForm, category: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="food">Food & Dining</option>
                <option value="shopping">Shopping</option>
                <option value="transportation">Transportation</option>
                <option value="utilities">Utilities</option>
                <option value="entertainment">Entertainment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Amount Range
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <input
                  type="number"
                  placeholder="Min"
                  value={filterForm.minAmount}
                  onChange={(e) => setFilterForm({ ...filterForm, minAmount: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filterForm.maxAmount}
                  onChange={(e) => setFilterForm({ ...filterForm, maxAmount: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="md:col-span-3 flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFilterForm({
                    startDate: '',
                    endDate: '',
                    category: '',
                    minAmount: '',
                    maxAmount: '',
                  });
                  updateFilters({});
                }}
              >
                Clear Filters
              </Button>
              <Button type="submit" variant="primary">
                Apply Filters
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Statistics Summary */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.count}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(statistics.total)}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Average Transaction</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(statistics.average)}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Most Common Category</p>
              <p className="text-2xl font-bold text-gray-900 capitalize">
                {Object.entries(statistics.categories)
                  .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Transactions List */}
      {Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
        <div key={date} className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{date}</h3>
          <div className="space-y-4">
            {dayTransactions.map((transaction) => (
              <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 text-lg font-medium">
                        {transaction.category[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {transaction.description}
                      </h4>
                      <p className="text-sm text-gray-500 capitalize">
                        {transaction.category}
                      </p>
                    </div>
                  </div>
                  <p className={`text-lg font-medium ${
                    transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(Math.abs(transaction.amount))}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-8">
          <Button
            variant="outline"
            disabled={pagination.currentPage === 1}
            onClick={() => goToPage(pagination.currentPage - 1)}
          >
            Previous
          </Button>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === pagination.currentPage ? 'primary' : 'outline'}
              onClick={() => goToPage(page)}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            disabled={pagination.currentPage === pagination.totalPages}
            onClick={() => goToPage(pagination.currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default Transactions;