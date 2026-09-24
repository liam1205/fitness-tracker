import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Must come before the React plugin so it can transform route files first.
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    host: true,
    // host: true binds all interfaces, but Vite still checks the incoming
    // Host header against an allowlist — without this, LAN requests get
    // "Blocked request. This host is not allowed."
    allowedHosts: true,
    proxy: {
      "/api": {
        // Overridden to the "backend" container hostname in docker-compose.yml;
        // defaults to localhost for running the frontend directly on the host.
        target: process.env.VITE_PROXY_TARGET || "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
