"use client";

import MinimalNavbar from './components/landing/MinimalNavbar';
import HeroCarousel from './components/landing/HeroCarousel';
import CategorySection from './components/landing/CategorySection';
import ReviewsSection from './components/landing/ReviewsSection';
import RoleSelectionModal from './components/landing/RoleSelectionModal';
import LineQRCodeSection from './components/landing/LineQRCodeSection';
import OwnerModals from './components/OwnerModals';
import { BrowseAIAssistant } from './browse/components/BrowseAIAssistant';
import { BrowseAIProvider } from './components/BrowseAIContext';
import { useLocale } from 'next-intl';

function LandingPageContent() {
  const locale = useLocale();

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Minimal Navbar - Fixed at top, always visible */}
      <MinimalNavbar />

      {/* Add padding-top to account for fixed navbar */}
      <div className="pt-[108px] md:pt-[120px]">
        {/* LINE QR Code Section - Moved to top for visibility */}
        <LineQRCodeSection />

        {/* Hero Section with Image Carousel */}
        <HeroCarousel />

        {/* Category Section */}
        <CategorySection />

        {/* Reviews Section */}
        <ReviewsSection />

        {/* Role Selection Modal for Login/Join */}
        <RoleSelectionModal />

        {/* Owner Modals for Login/Join */}
        <OwnerModals />
      </div>

      {/* AI Assistant - Global floating chat bubble */}
      <BrowseAIAssistant
        shops={[]}
        selectedPrefecture={undefined}
        selectedCity={undefined}
        selectedCategoryId={undefined}
        searchQuery={undefined}
        locale={locale as string}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <BrowseAIProvider>
      <LandingPageContent />
    </BrowseAIProvider>
  );
}
