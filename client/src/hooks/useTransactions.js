// useTransactions.js
import { useState, useEffect, useCallback } from 'react';
import FintrackAPI from '../api/fintrackApi';
import { useAuth } from '../contexts/AuthContext';

export const useTransactions = (initialFilters = {}) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });
  const { user } = useAuth();

  // Fetch transactions with current filters and pagination
  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...filters,
      };

      const response = await FintrackAPI.getTransactions(params);
      
      setTransactions(response.transactions);
      setPagination({
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalItems: response.totalItems,
        itemsPerPage: response.itemsPerPage,
      });
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch transactions');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [user, filters, pagination.currentPage, pagination.itemsPerPage]);

  // Fetch transactions when dependencies change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Update transaction
  const updateTransaction = async (transactionId, updates) => {
    try {
      setLoading(true);
      const updatedTransaction = await FintrackAPI.updateTransaction(transactionId, updates);
      
      // Update local state
      setTransactions(prevTransactions =>
        prevTransactions.map(transaction =>
          transaction.id === transactionId ? updatedTransaction : transaction
        )
      );
      
      setError(null);
      return { success: true, transaction: updatedTransaction };
    } catch (err) {
      setError(err.message || 'Failed to update transaction');
      console.error('Error updating transaction:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Update filters
  const updateFilters = (newFilters) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters,
    }));
    // Reset to first page when filters change
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
    }));
  };

  // Handle pagination
  const goToPage = (page) => {
    setPagination(prev => ({
      ...prev,
      currentPage: Math.max(1, Math.min(page, prev.totalPages)),
    }));
  };

  // Get transaction statistics
  const getStatistics = useCallback(() => {
    if (!transactions.length) return null;

    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    const average = total / transactions.length;
    const categories = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

    return {
      total,
      average,
      categories,
      count: transactions.length,
    };
  }, [transactions]);

  // Group transactions by date
  const getGroupedByDate = useCallback(() => {
    return transactions.reduce((groups, transaction) => {
      const date = new Date(transaction.date).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    }, {});
  }, [transactions]);

  return {
    transactions,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    updateTransaction,
    goToPage,
    refresh: fetchTransactions,
    statistics: getStatistics(),
    groupedTransactions: getGroupedByDate(),
  };
};