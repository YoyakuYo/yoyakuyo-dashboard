"use client";

import React from 'react';
import DesktopSidebar from './DesktopSidebar';
import MobileSidebar from './MobileSidebar';
import Header from './Header';

interface OwnerLayoutProps {
  children: React.ReactNode;
}

const OwnerLayout: React.FC<OwnerLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        <Header />
        <MobileSidebar />
        <main className="pt-14 min-h-screen bg-gray-50">
          {children}
        </main>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen">
        <DesktopSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 pt-16 bg-gray-50 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default OwnerLayout;