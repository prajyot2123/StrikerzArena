/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gold': 'var(--gold)',
        'dark-bg': 'var(--bg-primary)',
        'card-bg': 'var(--bg-secondary)',
        'app-input': 'var(--input-bg)',
        'border': 'var(--border-color)',
        'accent': 'var(--accent)',
        'primary': 'var(--text-primary)',
        'secondary': 'var(--text-secondary)',
      },
    },
  },
  plugins: [],
}
