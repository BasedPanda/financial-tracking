// Settings.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { themeConfig } from '../contexts/ThemeContext';

const Settings = () => {
  const { user, updateProfile, logout } = useAuth();
  const { theme, toggleTheme, primaryColor, updatePrimaryColor } = useTheme();
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currency: user?.currency || 'USD',
    notifications: user?.notifications || {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        setSuccess('Profile updated successfully');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Settings */}
        <Card title="Profile Settings">
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            {error && (
              <div className="bg-red-50 p-4 rounded-md text-red-800">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 p-4 rounded-md text-green-800">
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Preferred Currency
              </label>
              <select
                value={profileData.currency}
                onChange={(e) => setProfileData({ ...profileData, currency: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <Button type="submit" disabled={loading}>
              Save Changes
            </Button>
          </form>
        </Card>

        {/* Appearance Settings */}
        <Card title="Appearance">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <div className="flex items-center space-x-4">
                <Button
                  variant={theme === 'light' ? 'primary' : 'outline'}
                  onClick={() => theme !== 'light' && toggleTheme()}
                >
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'primary' : 'outline'}
                  onClick={() => theme !== 'dark' && toggleTheme()}
                >
                  Dark
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Color
              </label>
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(themeConfig.colors).map(([color, label]) => (
                  <Button
                    key={color}
                    variant={primaryColor === color ? 'primary' : 'outline'}
                    onClick={() => updatePrimaryColor(color)}
                    className="w-full"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card title="Notifications">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                <p className="text-sm text-gray-500">Receive updates via email</p>
              </div>
              <input
                type="checkbox"
                checked={profileData.notifications.email}
                onChange={(e) => setProfileData({
                  ...profileData,
                  notifications: {
                    ...profileData.notifications,
                    email: e.target.checked
                  }
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Push Notifications</h4>
                <p className="text-sm text-gray-500">Receive updates via push notifications</p>
              </div>
              <input
                type="checkbox"
                checked={profileData.notifications.push}
                onChange={(e) => setProfileData({
                  ...profileData,
                  notifications: {
                    ...profileData.notifications,
                    push: e.target.checked
                  }
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Account Actions */}
        <Card title="Account Actions">
          <div className="space-y-4">
            <Button variant="danger" onClick={handleLogout} className="w-full">
              Logout
            </Button>
            <Button variant="outline" className="w-full">
              Delete Account
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;