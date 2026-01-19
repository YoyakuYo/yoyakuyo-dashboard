"use client";

import React from 'react';
import OwnerSidebar from './OwnerSidebar';
import Header from './Header';

interface OwnerLayoutProps {
  children: React.ReactNode;
}

const OwnerLayout: React.FC<OwnerLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* OwnerSidebar - Unified component like AdminSidebar */}
      <OwnerSidebar />

      {/* Content Area - Takes remaining space like admin layout */}
      <div className="flex-1 flex flex-col">
        {/* Header - Inside content area, sticky like AdminHeader */}
        <Header />

        {/* Main Content - Flex-1, scrollable like admin layout */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default OwnerLayout;