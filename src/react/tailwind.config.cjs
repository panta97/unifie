/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "index.html",
    "./web/purchase_order_sheet/**/*.{js,ts,jsx,tsx}",
    "./web/stock_picking_sheet/**/*.{js,ts,jsx,tsx}",
    "./web/product_rpc/**/*.{js,ts,jsx,tsx}",
    "./web/pos_close_control/**/*.{js,ts,jsx,tsx}",
    "./web/miscellaneous/**/*.{js,ts,jsx,tsx}",
    "./web/k_abtao_goals/**/*.{js,ts,jsx,tsx}",
    "./web/k_tingo_goals/**/*.{js,ts,jsx,tsx}",
    "./web/prices_list/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        invoice: ["Inconsolata", "mono"],
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'pulse-slow': 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
