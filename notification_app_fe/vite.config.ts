import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Proxy API calls to backend during development
      "/notifications": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
