/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#E2E8F0', // slate-200 for a medium contrast backdrop
                surface: '#FFFFFF',
                'surface-hover': '#F8FAFC',
                'surface-muted': '#F1F5F9',
                panel: '#FFFFFF',
                primary: '#3B82F6', // Modern blue
                'primary-hover': '#2563EB',
                'primary-light': '#EFF6FF',
                accent: '#00D4AA', // Kept for futuristic teal touches
                alert: '#F59E0B',
                success: '#10B981',
                danger: '#EF4444',
                text: {
                    main: '#1E293B',
                    muted: '#64748B',
                    dark: '#0F172A',
                }
            },
            fontFamily: {
                sans: ['"DM Sans"', 'sans-serif'],
                display: ['"Playfair Display"', 'serif'],
            },
            animation: {
                pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                float: 'float 3s ease-in-out infinite',
                'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' },
                },
                slideUp: {
                    '0%': { opacity: 0, transform: 'translateY(20px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                }
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                'premium': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
            }
        },
    },
    plugins: [],
}
