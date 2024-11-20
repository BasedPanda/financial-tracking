// Budget.jsx
import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit2, Trash2 } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import BudgetProgress from '../components/dashboard/BudgetProgress';
import FintrackAPI from '../api/fintrackApi';

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    limit: '',
    period: 'monthly'
  });

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await FintrackAPI.getBudgets();
      setBudgets(response);
      setError(null);
    } catch (err) {
      setError('Failed to load budgets');
      console.error('Budgets fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingBudget) {
        await FintrackAPI.updateBudget(editingBudget.id, formData);
      } else {
        await FintrackAPI.createBudget(formData);
      }
      await fetchBudgets();
      setEditingBudget(null);
      setFormData({ category: '', limit: '', period: 'monthly' });
    } catch (err) {
      setError('Failed to save budget');
      console.error('Budget save error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (budgetId) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;

    try {
      setLoading(true);
      await FintrackAPI.deleteBudget(budgetId);
      await fetchBudgets();
    } catch (err) {
      setError('Failed to delete budget');
      console.error('Budget delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !budgets.length) {
    return <Loading fullScreen />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
        <Button
          onClick={() => setEditingBudget(null)}
          variant="primary"
          icon={<PlusCircle className="w-4 h-4" />}
        >
          Create Budget
        </Button>
      </div>

      {error && (
        <div className="mb-8 bg-red-50 p-4 rounded-md text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <BudgetProgress budgets={budgets} />
        </div>

        <div>
          <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingBudget ? 'Edit Budget' : 'Create New Budget'}
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Limit Amount
                </label>
                <input
                  type="number"
                  value={formData.limit}
                  onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Period
                </label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="flex space-x-4">
                <Button type="submit" variant="primary" className="w-full">
                  {editingBudget ? 'Update Budget' : 'Create Budget'}
                </Button>
                {editingBudget && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingBudget(null);
                      setFormData({ category: '', limit: '', period: 'monthly' });
                    }}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Budget;