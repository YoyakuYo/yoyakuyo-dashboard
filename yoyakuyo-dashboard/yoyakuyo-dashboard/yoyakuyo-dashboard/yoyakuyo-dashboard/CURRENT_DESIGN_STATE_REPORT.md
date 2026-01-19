# Current Design State Report
## Landing Page - Pre-Japanese Style Changes
**Date:** December 3, 2025

This document captures the complete current state of the landing page design before implementing Japanese-style changes. Use this to revert if needed.

---

## 📋 OVERALL STRUCTURE

### Main Page Component
**File:** `app/page.tsx`
- Background: `bg-black`
- Components:
  1. MinimalNavbar (transparent, absolute positioned)
  2. HeroCarousel (full-width hero section)
  3. CategorySection (white background, category cards)

---

## 🎨 COLOR SCHEME (Current)

### Primary Colors
- **Blue:** `blue-600`, `blue-700` (buttons, links, accents)
- **Blue Hover:** `blue-300` (navbar links)
- **Pink/Accent:** `accent-pink` (category card hover borders)
- **Background:** 
  - Main page: `bg-black`
  - Category section: `bg-white`
  - Hero overlay: `bg-black/50` and `bg-black/60`

### Text Colors
- **Primary:** `text-white` (hero, navbar)
- **Secondary:** `text-gray-900`, `text-gray-700`, `text-gray-600`
- **Hover:** `text-blue-300`

### Borders & Shadows
- **Category Cards:** `border-gray-100`, `border-gray-200`
- **Shadows:** `shadow-lg`, `shadow-xl`, `shadow-md`
- **Hover Shadows:** `hover:shadow-xl`, `hover:shadow-lg`

---

## 🏗️ COMPONENT DETAILS

### 1. MinimalNavbar
**File:** `app/components/landing/MinimalNavbar.tsx`

**Structure:**
- Position: `absolute top-0 left-0 right-0 z-50`
- Background: `bg-transparent`
- Height: `h-16`

**Left Section:**
- Logo: "Yoyaku Yo"
- Style: `text-xl font-semibold text-white hover:text-blue-300`

**Center Section:**
- Links: "Categories | Services"
- Style: `text-sm font-medium text-white hover:text-blue-300`
- Separator: `text-white/50`

**Right Section:**
- Language switcher
- Login button: `px-4 py-2 text-sm font-medium text-white hover:text-blue-300`
- Join button: `px-4 py-2 text-sm font-medium text-white hover:text-blue-300`

---

### 2. HeroCarousel
**File:** `app/components/landing/HeroCarousel.tsx`

**Structure:**
- Container: `relative w-full h-[70vh] min-h-[600px] overflow-hidden`
- Image carousel with 30 images
- Auto-advance: Every 3 seconds
- Transition: `duration-1000` fade

**Overlays:**
- Full dark overlay: `bg-black/50`
- Left gradient: `bg-gradient-to-r from-black/60 to-transparent z-10`

**Content:**
- Position: Left-aligned (`text-left pl-10 md:pl-12 lg:pl-16`)
- Title: `text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight drop-shadow-lg`
- Subtitle: `text-xl md:text-2xl lg:text-3xl text-white mb-4 font-light drop-shadow-md`
- Tagline: `text-base md:text-lg lg:text-xl text-white/90 font-light drop-shadow-md`

**No buttons or CTAs in current hero**

---

### 3. CategorySection
**File:** `app/components/landing/CategorySection.tsx`

**Structure:**
- Container: `py-16 md:py-24 bg-white`
- Layout: 3 rows, 2 columns on desktop (`grid md:grid-cols-2 gap-6`)
- Categories displayed: 6 total
  1. Beauty Services
  2. Spa, Onsen & Relaxation
  3. Hotels & Stays
  4. Dining & Izakaya
  5. Clinics & Medical Care
  6. Activities & Sports

---

### 4. CategoryCard
**File:** `app/components/landing/CategoryCard.tsx`

**Structure:**
- Container: `bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow`
- Layout: `grid md:grid-cols-2 gap-0`

**Left Side (Image):**
- Height: `h-72 md:h-full min-h-[300px]`
- Image indicators: 
  - Active: `w-8 bg-blue-600`
  - Inactive: `w-2 bg-white/50 hover:bg-white/75`
- Auto-advance: Every 4 seconds
- Transition: `duration-1000` fade

**Right Side (Content):**
- Padding: `p-6 md:p-8`
- Title: `text-2xl md:text-3xl font-bold text-gray-900 mb-2`
- Japanese title: `text-sm text-gray-600 mb-4`
- Description: `text-gray-700 mb-6 leading-relaxed`
- Selling points: 
  - Bullet: `text-blue-600 mt-1 font-bold`
  - Text: `text-sm text-gray-700`
- Button: `bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg`

---

### 5. CategoryGrid (Browse Page)
**File:** `app/components/landing/CategoryGrid.tsx`

**Structure:**
- Container: `py-16 md:py-24 bg-white`
- Grid: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6`

**Category Cards:**
- Border: `border-2 border-gray-200 hover:border-accent-pink`
- Shadow: `shadow-lg hover:shadow-xl`
- Aspect ratio: `aspect-[4/3]`
- Image overlay: `bg-gradient-to-t from-black/70 via-black/50 to-transparent`
- Title: `text-lg md:text-xl font-heading font-bold text-white drop-shadow-lg`
- Description: `text-xs md:text-sm text-white/90 drop-shadow-md`

**No Image Fallback:**
- Background: `bg-gradient-to-br from-gray-100 to-gray-200`

---

## 🎯 KEY STYLING PATTERNS

### Gradients
- Hero overlay: `bg-gradient-to-r from-black/60 to-transparent`
- Category text overlay: `bg-gradient-to-t from-black/70 via-black/50 to-transparent`
- No image fallback: `bg-gradient-to-br from-gray-100 to-gray-200`

### Transitions
- Shadows: `transition-shadow`
- Colors: `transition-colors`
- All: `transition-all duration-300`
- Image fade: `duration-1000`

### Border Radius
- Category cards: `rounded-xl`
- Category grid cards: `rounded-theme` (custom)
- Buttons: `rounded-lg`, `rounded-full`

### Typography
- Headings: `font-bold`, `font-heading`
- Body: `font-light`, `font-semibold`, `font-medium`
- Tracking: `tracking-tight` (hero title)

---

## 📐 LAYOUT SPECIFICATIONS

### Spacing
- Section padding: `py-16 md:py-24`
- Container padding: `px-4 sm:px-6 lg:px-8`
- Gap between cards: `gap-4 md:gap-6`, `gap-6`
- Content padding: `p-6 md:p-8`

### Max Widths
- Container: `max-w-7xl mx-auto`
- Hero content: `max-w-4xl`

### Heights
- Hero: `h-[70vh] min-h-[600px]`
- Navbar: `h-16`
- Category card images: `h-72 md:h-full min-h-[300px]`

---

## 🖼️ IMAGE HANDLING

### Hero Images
- 30 images in carousel
- Auto-advance: 3 seconds
- Fade transition: 1000ms
- Object fit: `object-cover object-center`

### Category Card Images
- Auto-advance: 4 seconds
- Fade transition: 1000ms
- Object fit: `object-cover object-center`
- Indicators: Bottom center

### Category Grid Images
- Manual navigation on hover
- Arrows: `bg-black/50 hover:bg-black/70`
- Indicators: `bg-white` (active), `bg-white/50` (inactive)

---

## 🔘 BUTTON STYLES

### Primary Buttons
- Background: `bg-blue-600 hover:bg-blue-700`
- Text: `text-white`
- Font: `font-semibold`
- Padding: `py-3 px-6` or `py-4 px-8`
- Border radius: `rounded-lg` or `rounded-full`
- Shadow: `shadow-md hover:shadow-lg` or `shadow-xl hover:shadow-2xl`

### Text Buttons (Navbar)
- No background
- Text: `text-white hover:text-blue-300`
- Padding: `px-4 py-2`
- Font: `text-sm font-medium`

---

## 🎨 CURRENT COLOR VALUES (Tailwind Classes)

### Blues
- `blue-300` - Hover states
- `blue-600` - Primary buttons, active states
- `blue-700` - Button hover

### Grays
- `gray-100` - Borders, fallback backgrounds
- `gray-200` - Borders
- `gray-600` - Secondary text
- `gray-700` - Body text
- `gray-900` - Headings

### Blacks/Whites
- `black` - Main page background
- `black/50` - Overlays
- `black/60` - Gradient overlays
- `white` - Text, backgrounds
- `white/50`, `white/70`, `white/90` - Text opacity variants

### Accents
- `accent-pink` - Category card hover border

---

## 📱 RESPONSIVE BREAKPOINTS

### Mobile
- Grid: 2 columns (`grid-cols-2`)
- Hero padding: `pl-10`
- Text sizes: Base sizes (no prefix)

### Tablet (md:)
- Grid: 3 columns (`md:grid-cols-3`)
- Hero padding: `md:pl-12`
- Text sizes: `md:text-*` variants
- Category cards: 2 columns (`md:grid-cols-2`)

### Desktop (lg:)
- Grid: 4 columns (`lg:grid-cols-4`)
- Hero padding: `lg:pl-16`
- Text sizes: `lg:text-*` variants

---

## 🔄 ANIMATIONS & INTERACTIONS

### Hover Effects
- Category cards: `hover:shadow-xl`, `hover:border-accent-pink`
- Buttons: `hover:bg-blue-700`, `hover:shadow-lg`
- Links: `hover:text-blue-300`

### Transitions
- All: `transition-all duration-300`
- Shadows: `transition-shadow`
- Colors: `transition-colors`
- Image fade: `duration-1000`

### Auto-Advance
- Hero: 3 seconds
- Category cards: 4 seconds

---

## 📝 FILES TO RESTORE (If Reverting)

1. `app/page.tsx` - Main page structure
2. `app/components/landing/MinimalNavbar.tsx` - Navigation
3. `app/components/landing/HeroCarousel.tsx` - Hero section
4. `app/components/landing/CategorySection.tsx` - Category section container
5. `app/components/landing/CategoryCard.tsx` - Individual category cards
6. `app/components/landing/CategoryGrid.tsx` - Browse page category grid
7. `tailwind.config.ts` - Color configuration (if modified)

---

## 🎯 CURRENT DESIGN PHILOSOPHY

- **Modern/Western:** Blue/purple gradients, clean lines
- **Bold:** Strong shadows, high contrast
- **Minimal:** Clean white backgrounds, simple layouts
- **Tech-forward:** Rounded corners, smooth transitions
- **Colorful:** Blue accents, pink highlights

---

**END OF REPORT**

