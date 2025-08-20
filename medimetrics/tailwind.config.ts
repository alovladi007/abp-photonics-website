import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx,mdx}', './components/**/*.{ts,tsx}', './content/**/*.{mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef8ff', 
          100: '#d9efff', 
          500: '#0760d9', 
          600: '#054aa8', 
          800: '#032f6b'
        }
      }
    },
  },
  plugins: [],
};
export default config;