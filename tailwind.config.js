/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#4F46E5', // Indigo 600
                secondary: '#10B981', // Emerald 500
                accent: '#F59E0B', // Amber 500
                surface: '#F3F4F6', // Gray 100
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                heading: ['Outfit', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
