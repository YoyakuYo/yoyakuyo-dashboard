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
      {/* Header - Fixed positioned for both mobile and desktop */}
      <Header />

      {/* Mobile Layout - Only render mobile sidebar */}
      <div className="lg:hidden">
        <MobileSidebar />
      </div>

      {/* Desktop Layout - Only render desktop sidebar */}
      <div className="hidden lg:block">
        <DesktopSidebar />
      </div>

      {/* Main Content - Always render, positioned correctly for both layouts */}
      <main className="lg:ml-64 pt-16 min-h-screen bg-gray-50">
        {children}
      </main>
    </div>
  );
};

export default OwnerLayout;