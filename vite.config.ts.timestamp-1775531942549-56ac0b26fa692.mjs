// vite.config.ts
import { defineConfig, loadEnv } from "file:///sessions/adoring-relaxed-johnson/mnt/alphatrader1/node_modules/vite/dist/node/index.js";
import react from "file:///sessions/adoring-relaxed-johnson/mnt/alphatrader1/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///sessions/adoring-relaxed-johnson/mnt/alphatrader1/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "/sessions/adoring-relaxed-johnson/mnt/alphatrader1";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const serverlessProxyTarget = env.VITE_API_ORIGIN?.replace(/\/$/, "");
  const proxy = {
    "/api/alpaca-data": {
      target: "https://data.alpaca.markets",
      changeOrigin: true,
      secure: true,
      rewrite: (p) => p.replace(/^\/api\/alpaca-data/, ""),
      configure: (p) => {
        p.on("proxyRes", (proxyRes) => {
          delete proxyRes.headers["www-authenticate"];
        });
      }
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
      }
    }
  };
  if (serverlessProxyTarget) {
    const forward = {
      target: serverlessProxyTarget,
      changeOrigin: true,
      secure: true
    };
    proxy["/api/chat"] = { ...forward };
    proxy["/api/generate-portfolio"] = { ...forward };
    proxy["/api/auto-rebalance"] = { ...forward };
    proxy["/api/morning-briefing"] = { ...forward };
  }
  return {
    server: {
      host: "::",
      port: 8080,
      proxy
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvYWRvcmluZy1yZWxheGVkLWpvaG5zb24vbW50L2FscGhhdHJhZGVyMVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3Nlc3Npb25zL2Fkb3JpbmctcmVsYXhlZC1qb2huc29uL21udC9hbHBoYXRyYWRlcjEvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL3Nlc3Npb25zL2Fkb3JpbmctcmVsYXhlZC1qb2huc29uL21udC9hbHBoYXRyYWRlcjEvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCBcIlwiKTtcbiAgY29uc3Qgc2VydmVybGVzc1Byb3h5VGFyZ2V0ID0gZW52LlZJVEVfQVBJX09SSUdJTj8ucmVwbGFjZSgvXFwvJC8sIFwiXCIpO1xuXG4gIGNvbnN0IHByb3h5OiBSZWNvcmQ8c3RyaW5nLCBpbXBvcnQoXCJ2aXRlXCIpLlByb3h5T3B0aW9ucz4gPSB7XG4gICAgXCIvYXBpL2FscGFjYS1kYXRhXCI6IHtcbiAgICAgIHRhcmdldDogXCJodHRwczovL2RhdGEuYWxwYWNhLm1hcmtldHNcIixcbiAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgIHNlY3VyZTogdHJ1ZSxcbiAgICAgIHJld3JpdGU6IChwKSA9PiBwLnJlcGxhY2UoL15cXC9hcGlcXC9hbHBhY2EtZGF0YS8sIFwiXCIpLFxuICAgICAgY29uZmlndXJlOiAocCkgPT4ge1xuICAgICAgICBwLm9uKFwicHJveHlSZXNcIiwgKHByb3h5UmVzKSA9PiB7XG4gICAgICAgICAgZGVsZXRlIHByb3h5UmVzLmhlYWRlcnNbXCJ3d3ctYXV0aGVudGljYXRlXCJdO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgfSxcbiAgICBcIi9hcGkvYWxwYWNhXCI6IHtcbiAgICAgIHRhcmdldDogXCJodHRwczovL3BhcGVyLWFwaS5hbHBhY2EubWFya2V0c1wiLFxuICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgc2VjdXJlOiB0cnVlLFxuICAgICAgcmV3cml0ZTogKHApID0+IHAucmVwbGFjZSgvXlxcL2FwaVxcL2FscGFjYS8sIFwiXCIpLFxuICAgICAgY29uZmlndXJlOiAocCkgPT4ge1xuICAgICAgICBwLm9uKFwicHJveHlSZXNcIiwgKHByb3h5UmVzKSA9PiB7XG4gICAgICAgICAgZGVsZXRlIHByb3h5UmVzLmhlYWRlcnNbXCJ3d3ctYXV0aGVudGljYXRlXCJdO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgfSxcbiAgfTtcblxuICAvLyBMb2NhbCBkZXY6IFZpdGUgZG9lcyBub3QgZXhlY3V0ZSBgYXBpLyouanNgLiBQcm94eSBzZXJ2ZXJsZXNzIHJvdXRlcyB0byB5b3VyIGRlcGxveWVkIFVSTFxuICAvLyB3aGVuIGBWSVRFX0FQSV9PUklHSU5gIGlzIGluIGAuZW52LmxvY2FsYCAoc2FtZSB2YWx1ZSB0aGUgY2xpZW50IG1heSB1c2UgXHUyMDE0IHNlZSBgc2VydmVybGVzc0FwaVVybGApLlxuICBpZiAoc2VydmVybGVzc1Byb3h5VGFyZ2V0KSB7XG4gICAgY29uc3QgZm9yd2FyZDogaW1wb3J0KFwidml0ZVwiKS5Qcm94eU9wdGlvbnMgPSB7XG4gICAgICB0YXJnZXQ6IHNlcnZlcmxlc3NQcm94eVRhcmdldCxcbiAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgIHNlY3VyZTogdHJ1ZSxcbiAgICB9O1xuICAgIHByb3h5W1wiL2FwaS9jaGF0XCJdID0geyAuLi5mb3J3YXJkIH07XG4gICAgcHJveHlbXCIvYXBpL2dlbmVyYXRlLXBvcnRmb2xpb1wiXSA9IHsgLi4uZm9yd2FyZCB9O1xuICAgIHByb3h5W1wiL2FwaS9hdXRvLXJlYmFsYW5jZVwiXSA9IHsgLi4uZm9yd2FyZCB9O1xuICAgIHByb3h5W1wiL2FwaS9tb3JuaW5nLWJyaWVmaW5nXCJdID0geyAuLi5mb3J3YXJkIH07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHNlcnZlcjoge1xuICAgICAgaG9zdDogXCI6OlwiLFxuICAgICAgcG9ydDogODA4MCxcbiAgICAgIHByb3h5LFxuICAgIH0sXG4gICAgcGx1Z2luczogW3JlYWN0KCksIG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIiAmJiBjb21wb25lbnRUYWdnZXIoKV0uZmlsdGVyKEJvb2xlYW4pLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgICAgfSxcbiAgICB9LFxuICB9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXdVLFNBQVMsY0FBYyxlQUFlO0FBQzlXLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFIaEMsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDeEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxRQUFRLElBQUksR0FBRyxFQUFFO0FBQzNDLFFBQU0sd0JBQXdCLElBQUksaUJBQWlCLFFBQVEsT0FBTyxFQUFFO0FBRXBFLFFBQU0sUUFBcUQ7QUFBQSxJQUN6RCxvQkFBb0I7QUFBQSxNQUNsQixRQUFRO0FBQUEsTUFDUixjQUFjO0FBQUEsTUFDZCxRQUFRO0FBQUEsTUFDUixTQUFTLENBQUMsTUFBTSxFQUFFLFFBQVEsdUJBQXVCLEVBQUU7QUFBQSxNQUNuRCxXQUFXLENBQUMsTUFBTTtBQUNoQixVQUFFLEdBQUcsWUFBWSxDQUFDLGFBQWE7QUFDN0IsaUJBQU8sU0FBUyxRQUFRLGtCQUFrQjtBQUFBLFFBQzVDLENBQUM7QUFBQSxNQUNIO0FBQUEsSUFDRjtBQUFBLElBQ0EsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLE1BQ1IsY0FBYztBQUFBLE1BQ2QsUUFBUTtBQUFBLE1BQ1IsU0FBUyxDQUFDLE1BQU0sRUFBRSxRQUFRLGtCQUFrQixFQUFFO0FBQUEsTUFDOUMsV0FBVyxDQUFDLE1BQU07QUFDaEIsVUFBRSxHQUFHLFlBQVksQ0FBQyxhQUFhO0FBQzdCLGlCQUFPLFNBQVMsUUFBUSxrQkFBa0I7QUFBQSxRQUM1QyxDQUFDO0FBQUEsTUFDSDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBSUEsTUFBSSx1QkFBdUI7QUFDekIsVUFBTSxVQUF1QztBQUFBLE1BQzNDLFFBQVE7QUFBQSxNQUNSLGNBQWM7QUFBQSxNQUNkLFFBQVE7QUFBQSxJQUNWO0FBQ0EsVUFBTSxXQUFXLElBQUksRUFBRSxHQUFHLFFBQVE7QUFDbEMsVUFBTSx5QkFBeUIsSUFBSSxFQUFFLEdBQUcsUUFBUTtBQUNoRCxVQUFNLHFCQUFxQixJQUFJLEVBQUUsR0FBRyxRQUFRO0FBQzVDLFVBQU0sdUJBQXVCLElBQUksRUFBRSxHQUFHLFFBQVE7QUFBQSxFQUNoRDtBQUVBLFNBQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOO0FBQUEsSUFDRjtBQUFBLElBQ0EsU0FBUyxDQUFDLE1BQU0sR0FBRyxTQUFTLGlCQUFpQixnQkFBZ0IsQ0FBQyxFQUFFLE9BQU8sT0FBTztBQUFBLElBQzlFLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUN0QztBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
