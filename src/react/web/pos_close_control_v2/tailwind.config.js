/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                'mono': ['Monaco', 'Menlo', 'Consolas', 'monospace'],
            },
        },
    },
    plugins: [],
}
