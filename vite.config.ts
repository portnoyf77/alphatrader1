import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const serverlessProxyTarget = env.VITE_API_ORIGIN?.replace(/\/$/, "");

  const proxy: Record<string, import("vite").ProxyOptions> = {
    "/api/alpaca-data": {
      target: "https://data.alpaca.markets",
      changeOrigin: true,
      secure: true,
      rewrite: (p) => p.replace(/^\/api\/alpaca-data/, ""),
      configure: (p) => {
        p.on("proxyRes", (proxyRes) => {
          delete proxyRes.headers["www-authenticate"];
        });
      },
    },
    "/api/alpaca": {
      target: "https://paper-api.alpaca.markets",
      changeOrigin: true,
      secure: true,
      rewrite: (p) => p.replace(/^\/api\/alpaca/, ""),
      configure: (p) => {
        p.on("proxyRes", (proxyRes) => {
          delete proxyRes.headers["www-authenticate"];
        });
      },
    },
  };

  // Local dev: Vite does not execute `api/*.js`. Proxy serverless routes to your deployed URL
  // when `VITE_API_ORIGIN` is in `.env.local` (same value the client may use — see `serverlessApiUrl`).
  if (serverlessProxyTarget) {
    const forward: import("vite").ProxyOptions = {
      target: serverlessProxyTarget,
      changeOrigin: true,
      secure: true,
    };
    proxy["/api/chat"] = { ...forward };
    proxy["/api/generate-portfolio"] = { ...forward };
    proxy["/api/portfolio-recommend"] = { ...forward };
    proxy["/api/portfolio-advice"] = { ...forward };
    proxy["/api/auto-rebalance"] = { ...forward };
    proxy["/api/morning-briefing"] = { ...forward };
  }

  return {
    server: {
      host: "::",
      port: 8080,
      proxy,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
