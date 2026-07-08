/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#0f1535' },
        // OCPS (source B) design tokens — merged per MERGE_PLAN.md Phase 0
        surface: {
          0: '#F1F5F9',
          1: '#F8FAFC',
          2: '#FFFFFF',
        },
        border: {
          DEFAULT: '#E2E8F0',
          strong: '#CBD5E1',
          accent: '#3B82F6',
        },
        sidebar: {
          bg: '#0F172A',
          hover: 'rgba(255,255,255,0.07)',
          active: '#1E3A8A',
          text: '#94A3B8',
          label: '#475569',
        },
        ds: {
          'text-primary':   '#0F172A',
          'text-secondary': '#475569',
          'text-muted':     '#94A3B8',
          'text-accent':    '#1D4ED8',
          'text-warning':   '#92400E',
          'text-success':   '#166534',
          'text-danger':    '#991B1B',
          'fill-primary':   '#2563EB',
          'fill-success':   '#16A34A',
          'fill-danger':    '#EF4444',
          'fill-warning':   '#D97706',
          'bg-warning':     '#FEF3C7',
          'bg-success':     '#DCFCE7',
          'bg-danger':      '#FEE2E2',
          'bg-accent':      '#EFF6FF',
          'bg-accent-mid':  '#DBEAFE',
          'on-primary':     '#FFFFFF',
          'on-success':     '#FFFFFF',
          'on-danger':      '#FFFFFF',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04)',
        dropdown: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}

