/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'brand-bg':       'var(--color-bg)',
        'brand-surface':  'var(--color-surface)',
        'brand-border':   'var(--color-border)',
        'brand-text':     'var(--color-text)',
        'brand-muted':    'var(--color-muted)',
        'brand-btn':      'var(--color-btn-bg)',
        'brand-btn-text': 'var(--color-btn-text)',
        'brand-error':    'var(--color-error)',
        'brand-success':  'var(--color-success)',
      },
    },
  },
  plugins: [],
}

