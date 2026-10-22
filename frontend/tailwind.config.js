/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#FAF8F5',   // softest ivory workspace
          100: '#F5F2EB',  // paper surface
          200: '#EAE5D9',  // subtle borders / rules
          300: '#DCD5C5',  // active borders
          400: '#B8AFA0',  // subdued markers
        },
        ink: {
          900: '#161513',  // deep primary ink
          800: '#2A2723',  // headings & emphasis
          700: '#46413A',  // body text
          500: '#716B61',  // secondary / metadata
          400: '#9B9487',  // muted placeholders
          300: '#C7BFB2',  // faint rule lines
        },
        rust: {
          50: '#FDF6F3',
          100: '#F9E9E2',
          500: '#B84525',
          600: '#9E381C',  // primary editorial accent
          700: '#842D15',  // hover accent
        },
        olive: {
          50: '#F5F7F3',
          100: '#E6EAE1',
          700: '#3D4A37',
          800: '#2F3A2A',
        },
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(22, 21, 19, 0.04), 0 1px 2px -1px rgba(22, 21, 19, 0.04)',
        'sheet': '0 4px 20px -2px rgba(22, 21, 19, 0.06), 0 2px 6px -1px rgba(22, 21, 19, 0.04)',
      },
    },
  },
  plugins: [],
};
