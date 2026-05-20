// src/components/MainContent.tsx
import React from 'react';

interface MainContentProps {
  pageTitle: string;
  children: React.ReactNode;
}

export const MainContent: React.FC<MainContentProps> = ({ pageTitle, children }) => {
  return (
    <main className="flex-1 overflow-x-auto overflow-y-auto bg-gray-100 dark:bg-gray-900 p-2 sm:p-4 md:p-6 min-w-0">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100">
          {pageTitle}
        </h2>
      </div>
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-3 sm:p-4 md:p-6 min-w-0">
        {children}
      </div>
    </main>
  );
};
