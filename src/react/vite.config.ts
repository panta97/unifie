/** @type {import('vite').UserConfig} */

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 9000,
  },
  plugins: [react()],
  base: "/react-static/",
  build: {
    sourcemap: true,
    manifest: true,
    // outDir: '../django/django_kdosh/static',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sales: "web/k_sales/index.tsx",
        barcode: "web/barcode/index.tsx",
        purchase_order_sheet: "web/purchase_order_sheet/index.tsx",
        product_rpc: "web/product_rpc/index.tsx",
        pos_close_control: "web/pos_close_control/index.tsx",
        misscellaneous: "web/miscellaneous/index.tsx",
        gift_card: "web/gift_card/index.tsx",
        default: "web/default/main.tsx",
      },
    },
  },
});
