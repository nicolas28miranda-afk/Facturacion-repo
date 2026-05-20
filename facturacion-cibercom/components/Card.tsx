
import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '', id }) => {
  return (
    <div id={id} className={`bg-white dark:bg-gray-800 shadow-md rounded-lg p-1 ${className} border border-gray-200 dark:border-gray-700`}>
      {title && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
      )}
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
};
    