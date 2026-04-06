import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Longer prefix first: `/api/alpaca-data` starts with `/api/alpaca` and must not hit the trading proxy.
    proxy: {
      "/api/alpaca-data": {
        target: "https://data.alpaca.markets",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/alpaca-data/, ""),
        configure: (proxy) => {
          proxy.on("proxyRes", (proxyRes) => {
            delete proxyRes.headers["www-authenticate"];
          });
        },
      },
      "/api/alpaca": {
        target: "https://paper-api.alpaca.markets",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/alpaca/, ""),
        configure: (proxy) => {
          proxy.on("proxyRes", (proxyRes) => {
            delete proxyRes.headers["www-authenticate"];
          });
        },
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
