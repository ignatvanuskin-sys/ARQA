import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, loadEnv, type Plugin } from "vite";

/**
 * Injects the Umami analytics script into index.html at build time,
 * but only when both variables are configured (any self-hosted Umami works).
 * Without them the site ships with zero third-party scripts.
 */
function injectAnalytics(): Plugin {
  return {
    name: "inject-analytics",
    transformIndexHtml(html, ctx) {
      const env = loadEnv(ctx.env?.mode ?? process.env.NODE_ENV ?? "production", process.cwd(), "");
      const endpoint = env.VITE_ANALYTICS_ENDPOINT?.replace(/\/+$/, "");
      const websiteId = env.VITE_ANALYTICS_WEBSITE_ID;
      if (!endpoint || !websiteId || ctx.server) return html;
      const tag = `\n    <script defer src="${endpoint}/umami" data-website-id="${websiteId}"></script>`;
      return html.replace("</body>", `${tag}\n  </body>`);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), injectAnalytics()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
        },
      },
    },
  },
  server: {
    port: 3000,
    strictPort: false,
    host: true,
  },
});
