// Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  BarChart3,
  Settings,
  CreditCard,
  HelpCircle
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', href: '/transactions', icon: Receipt },
    { name: 'Accounts', href: '/accounts', icon: CreditCard },
    { name: 'Budgets', href: '/budgets', icon: PiggyBank },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex flex-col flex-grow border-r border-gray-200 bg-white pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            FinTrack
          </Link>
        </div>
        <nav className="mt-8 flex-1 flex flex-col" aria-label="Sidebar">
          <div className="px-2 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <Icon
                    className={`${
                      isActive(item.href)
                        ? 'text-blue-600'
                        : 'text-gray-400 group-hover:text-gray-500'
                    } mr-3 h-5 w-5 flex-shrink-0`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="mt-auto px-4 pb-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            icon={<HelpCircle className="w-4 h-4" />}
          >
            Help & Support
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;