import React from 'react';

const Loading = ({ 
  size = 'md', 
  color = 'blue',
  fullScreen = false,
  message = 'Loading...'
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const colors = {
    blue: 'text-blue-600',
    gray: 'text-gray-600',
    white: 'text-white'
  };

  const wrapper = fullScreen ? 'fixed inset-0 flex items-center justify-center bg-gray-900/50' : 'flex items-center justify-center';

  return (
    <div className={wrapper}>
      <div className="flex flex-col items-center">
        <svg
          className={`animate-spin ${sizes[size]} ${colors[color]}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {message && (
          <p className={`mt-2 text-sm font-medium ${fullScreen ? 'text-white' : 'text-gray-900'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Loading;