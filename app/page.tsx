"use client";

import MinimalNavbar from './components/landing/MinimalNavbar';
import HeroCarousel from './components/landing/HeroCarousel';
import OwnerModals from './components/OwnerModals';

export default function HomePage() {
  return (
    <div className="w-full min-h-screen bg-black">
      {/* Minimal Navbar */}
      <MinimalNavbar />

      {/* Hero Section with Image Carousel */}
      <HeroCarousel />

      {/* Owner Modals for Login/Join */}
      <OwnerModals />
    </div>
  );
}
