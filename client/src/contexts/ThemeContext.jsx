// ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('fintrack_theme');
    return savedTheme || 'light';
  });

  const [primaryColor, setPrimaryColor] = useState(() => {
    const savedColor = localStorage.getItem('fintrack_primary_color');
    return savedColor || 'blue';
  });

  useEffect(() => {
    localStorage.setItem('fintrack_theme', theme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('fintrack_primary_color', primaryColor);
    // Update CSS variables for primary color
    const root = document.documentElement;
    const colors = {
      blue: {
        primary: '#2563eb',
        light: '#60a5fa',
        dark: '#1e40af'
      },
      green: {
        primary: '#16a34a',
        light: '#4ade80',
        dark: '#15803d'
      },
      purple: {
        primary: '#9333ea',
        light: '#c084fc',
        dark: '#7e22ce'
      },
      indigo: {
        primary: '#4f46e5',
        light: '#818cf8',
        dark: '#3730a3'
      }
    };

    const selectedColor = colors[primaryColor];
    root.style.setProperty('--color-primary', selectedColor.primary);
    root.style.setProperty('--color-primary-light', selectedColor.light);
    root.style.setProperty('--color-primary-dark', selectedColor.dark);
  }, [primaryColor]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const updatePrimaryColor = (color) => {
    if (['blue', 'green', 'purple', 'indigo'].includes(color)) {
      setPrimaryColor(color);
    }
  };

  const value = {
    theme,
    toggleTheme,
    primaryColor,
    updatePrimaryColor,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const themeConfig = {
  colors: {
    blue: 'Blue',
    green: 'Green',
    purple: 'Purple',
    indigo: 'Indigo'
  },
  colorClasses: {
    blue: {
      primary: 'text-blue-600',
      background: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      border: 'border-blue-600'
    },
    green: {
      primary: 'text-green-600',
      background: 'bg-green-600',
      hover: 'hover:bg-green-700',
      border: 'border-green-600'
    },
    purple: {
      primary: 'text-purple-600',
      background: 'bg-purple-600',
      hover: 'hover:bg-purple-700',
      border: 'border-purple-600'
    },
    indigo: {
      primary: 'text-indigo-600',
      background: 'bg-indigo-600',
      hover: 'hover:bg-indigo-700',
      border: 'border-indigo-600'
    }
  }
};