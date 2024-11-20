// Card.jsx
import React from 'react';

const Card = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  footer,
  hoverable = false,
  noPadding = false,
}) => {
  const baseClasses = 'bg-white rounded-lg shadow-sm border border-gray-200';
  const hoverClasses = hoverable ? 'transition-transform duration-200 hover:-translate-y-1 hover:shadow-md' : '';
  const paddingClasses = noPadding ? '' : 'p-6';

  return (
    <div className={`${baseClasses} ${hoverClasses} ${className}`}>
      {(title || subtitle || action) && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">
                  {subtitle}
                </p>
              )}
            </div>
            {action && (
              <div className="ml-4">
                {action}
              </div>
            )}
          </div>
        </div>
      )}
      <div className={paddingClasses}>
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;