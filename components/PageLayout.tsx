
import React, { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, title, showBackButton, onBack }) => {
  return (
    <div className="min-h-screen bg-sky-50 flex flex-col">
      {title && (
        <header className="bg-gradient-to-r from-sky-500 to-cyan-400 text-white p-4 shadow-md sticky top-0 z-50 flex items-center">
          {showBackButton && onBack && (
            <button onClick={onBack} className="mr-3 p-1 rounded-full hover:bg-sky-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
          <h1 className="text-xl font-semibold">{title}</h1>
        </header>
      )}
      <main className="flex-grow p-4 overflow-y-auto"> 
        {children}
      </main>
    </div>
  );
};

export default PageLayout;
