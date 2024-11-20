// AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FintrackAPI from '../api/fintrackApi';
import Loading from '../components/common/Loading';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is authenticated on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('fintrack_token');
      if (token) {
        try {
          const userData = await FintrackAPI.getUserProfile();
          setUser(userData);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          localStorage.removeItem('fintrack_token');
          localStorage.removeItem('fintrack_refresh_token');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const { user: userData, token, refreshToken } = await FintrackAPI.login(email, password);
      localStorage.setItem('fintrack_token', token);
      localStorage.setItem('fintrack_refresh_token', refreshToken);
      setUser(userData);
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      const errorData = FintrackAPI.handleError(error);
      return {
        success: false,
        error: errorData.message || 'Failed to login'
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const { user: newUser, token, refreshToken } = await FintrackAPI.register(userData);
      localStorage.setItem('fintrack_token', token);
      localStorage.setItem('fintrack_refresh_token', refreshToken);
      setUser(newUser);
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      const errorData = FintrackAPI.handleError(error);
      return {
        success: false,
        error: errorData.message || 'Failed to register'
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await FintrackAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('fintrack_token');
      localStorage.removeItem('fintrack_refresh_token');
      setUser(null);
      navigate('/login');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      const updatedUser = await FintrackAPI.updateUserProfile(profileData);
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      const errorData = FintrackAPI.handleError(error);
      return {
        success: false,
        error: errorData.message || 'Failed to update profile'
      };
    } finally {
      setLoading(false);
    }
  };

  // Protected route wrapper
  const RequireAuth = ({ children }) => {
    if (loading) {
      return <Loading fullScreen />;
    }

    if (!user) {
      navigate('/login');
      return null;
    }

    return children;
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    RequireAuth
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};