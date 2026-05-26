/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1a1a2e',
        brand: '#16213e',
        sand: '#f7f3ee',
        mist: '#edf2f7',
        gold: '#d9a441',
      },
      fontFamily: {
        heading: ['"Inter"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 24px 60px rgba(22, 33, 62, 0.08)',
      },
      backgroundImage: {
        'hero-overlay':
          'linear-gradient(135deg, rgba(17,24,39,0.82), rgba(22,33,62,0.56))',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};
