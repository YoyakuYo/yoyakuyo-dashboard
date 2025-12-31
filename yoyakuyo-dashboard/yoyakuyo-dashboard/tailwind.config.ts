/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',

    // Or if using `src` directory:
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-bg': '#050816',
        'primary-text': '#F9FAFB',
        'accent-pink': '#EC4899',
        'accent-blue': '#0EA5E9',
        'muted-text': '#9CA3AF',
        'card-bg': '#0B1120',
        'border-soft': '#1F2933',
        // Japanese color palette
        'japanese-red': '#C41E3A', // Traditional Japanese red (aka-beni)
        'japanese-gold': '#D4AF37', // Japanese gold (kin)
        'japanese-cream': '#FFF8E7', // Soft cream (shiro)
        'japanese-sage': '#9CAF88', // Sage green (mizu)
        'japanese-charcoal': '#2C2C2C', // Charcoal (sumi)
        'japanese-paper': '#F5F1E8', // Paper white (washi)
        'japanese-coral': '#FF6B6B', // Soft coral (sakura-iro)
        'japanese-teal': '#4A90A4', // Teal blue (mizu-iro)
      },
      fontFamily: {
        heading: ['Poppins', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'theme': '1.2rem',
      },
    },
  },
  plugins: [],
}

