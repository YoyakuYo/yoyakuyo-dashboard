# Public Landing Page Backup

**Date:** 2025-01-27  
**Backup Created By:** AI Assistant

## Files Identified

### Main Landing Page
- `app/page.tsx` - Main landing page component (690 lines)
  - Contains: HomeContent component with modals, search, hero section, "How It Works" section
  - Uses: LandingHeader, CategoryCarousel
  - Hero section: Uses CategoryCarousel with overlay text

### Related Components
- `app/components/LandingHeader.tsx` - Header with language switcher and login/signup buttons
- `app/components/CategoryCarousel.tsx` - Current hero carousel component

## Current Hero Structure

The current hero section (lines 354-380 in `app/page.tsx`):

```tsx
<section className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden">
  <div className="absolute inset-0">
    <CategoryCarousel />
  </div>
  
  {/* Additional dark overlay for better text contrast */}
  <div className="absolute inset-0 bg-black/30 z-10" />
  
  {/* Overlay with Title and CTA */}
  <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
    <div className="text-center px-4 pointer-events-auto">
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 drop-shadow-2xl">
        {t('home.heroTitle')}
      </h1>
      <p className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-8 drop-shadow-lg">
        {t('home.heroSubtitle')}
      </p>
      <Link
        href="/browse"
        className="inline-block bg-gradient-to-r from-pink-500 to-blue-600 hover:from-pink-600 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 text-lg"
      >
        {t('home.browseShops')}
      </Link>
    </div>
  </div>
</section>
```

## Current Page Structure

1. **LandingHeader** - Navigation with language switcher
2. **Hero Section** - CategoryCarousel with overlay text
3. **Search & Quick Actions** - Search bar and category/area links
4. **How It Works** - 3 cards (For Customers, For Owners, AI Assistance)
5. **Login/Signup Modals** - Modal components for authentication

## Current Styling

- Uses Tailwind CSS classes
- Colors: pink-500, blue-600, gray-50, white
- Typography: Default system fonts
- Border radius: rounded-full, rounded-2xl, rounded-lg

## Features to Preserve

- ✅ AI chat bubble (BrowseAIAssistant) - must remain untouched
- ✅ Booking flow - must not break
- ✅ Shop browse/filters - must continue working
- ✅ Language toggle - must continue working
- ✅ Search functionality - must continue working
- ✅ Login/Signup modals - must continue working

## Notes

- The current CategoryCarousel is used as a background image carousel
- The hero text is overlaid on top of the carousel
- The page uses next-intl for translations
- The page is client-side rendered ("use client")

---

## NEW IMPLEMENTATION (2025-01-27)

### Files Created
1. `src/styles/theme.ts` - Design system with colors, typography, and theme classes
2. `app/components/landing/categorySlides.ts` - Slide data configuration (16 slides)
3. `app/components/landing/HeroCarousel.tsx` - New hero carousel component
4. `supabase/migrations/20250127_create_landing_hero_sections.sql` - Database migration for hero sections

### Files Modified
1. `app/page.tsx` - Rebuilt landing page with new structure:
   - Replaced CategoryCarousel with HeroCarousel
   - Updated all sections to use new theme colors
   - Added BrowseAIProvider wrapper
   - Added BrowseAIAssistant component
   - Updated "How It Works" section styling
   - Added CTA section for shop owners
2. `app/globals.css` - Added Google Fonts imports (Poppins, Inter) and CSS variables
3. `tailwind.config.ts` - Extended theme with new colors and fonts

### Design System
- **Colors:** primary-bg (#050816), primary-text (#F9FAFB), accent-pink (#EC4899), accent-blue (#0EA5E9), muted-text (#9CA3AF), card-bg (#0B1120), border-soft (#1F2933)
- **Typography:** Poppins for headings, Inter for body text
- **Border Radius:** 1.2rem (rounded-theme)

### How to Change Slide Text/Images Later

1. **Update Slide Data:**
   - Edit `app/components/landing/categorySlides.ts`
   - Modify `titleEn`, `titleJa`, `subtitleEn`, `subtitleJa` for any slide

2. **Update Images:**
   - Currently uses category images from `/public/categories/`
   - To use custom hero images:
     - Add images to `/public/hero/` directory
     - Update `getImagePath()` function in `HeroCarousel.tsx`
     - Or use database: Run migration `20250127_create_landing_hero_sections.sql` and populate `landing_hero_sections` table

3. **Database-Driven Approach (Future):**
   - Run migration: `supabase/migrations/20250127_create_landing_hero_sections.sql`
   - Insert slide data into `landing_hero_sections` table
   - Update `HeroCarousel.tsx` to fetch from database instead of static config

