"use client";

import MinimalNavbar from './components/landing/MinimalNavbar';
import HeroCarousel from './components/landing/HeroCarousel';
import CategorySection from './components/landing/CategorySection';
import RoleSelectionModal from './components/landing/RoleSelectionModal';
import OwnerModals from './components/OwnerModals';

export default function HomePage() {
  return (
    <div className="w-full min-h-screen bg-japanese-paper">
      {/* Minimal Navbar */}
      <MinimalNavbar />

      {/* Hero Section with Image Carousel */}
      <HeroCarousel />

      {/* Category Section */}
      <CategorySection />

      {/* Role Selection Modal for Login/Join */}
      <RoleSelectionModal />

      {/* Owner Modals for Login/Join */}
      <OwnerModals />
    </div>
  );
}
