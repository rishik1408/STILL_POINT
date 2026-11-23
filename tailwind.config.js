/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Still Point Stone & Sage Palette
        stone: {
          DEFAULT: '#F6F4EF',
          50: '#FAF9F6',
          100: '#F6F4EF',
          200: '#EDE9E0',
          300: '#E4E0D6',
        },
        linen: {
          DEFAULT: '#E4E0D6',
          50: '#F5F3EE',
          100: '#E4E0D6',
          200: '#D5CFBE',
          300: '#C5BDA6',
        },
        sage: {
          DEFAULT: '#A3AD9C',
          50: '#F4F5F3',
          100: '#E6E9E4',
          200: '#C7CEB9',
          300: '#A3AD9C',
          400: '#8A9782',
        },
        moss: {
          DEFAULT: '#5E6F63',
          50: '#F0F3F1',
          100: '#DEE4E0',
          300: '#8CA193',
          400: '#6F8375',
          500: '#5E6F63',
          600: '#4D5E52',
          700: '#3D4B41',
          800: '#2D3830',
        },
        bark: {
          DEFAULT: '#26302A',
          50: '#F2F4F3',
          100: '#E1E5E2',
          300: '#69786E',
          500: '#3D4B41',
          700: '#26302A',
          800: '#1D2520',
          900: '#141A16',
        },
        clay: {
          DEFAULT: '#C58A66',
          50: '#FAF4F0',
          100: '#F2E4DC',
          200: '#E4C8B7',
          300: '#D5AB91',
          400: '#C58A66',
          500: '#B57955',
          600: '#9B6140',
          700: '#7C4B2E',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(38, 48, 42, 0.05), 0 1px 2px 0 rgba(38, 48, 42, 0.03)',
        'card-hover': '0 10px 25px -5px rgba(38, 48, 42, 0.08), 0 8px 10px -6px rgba(38, 48, 42, 0.04)',
      },
    },
  },
  plugins: [],
};
