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

