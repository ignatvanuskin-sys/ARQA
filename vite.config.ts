import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig, loadEnv, type Plugin } from "vite";

/**
 * Inlines the single CSS bundle into index.html at build time.
 * Saves a render-blocking request (~1.2 s under slow-4G throttling);
 * at ~44 KB the stylesheet is cheaper to ship with the HTML shell.
 */
function inlineCss(): Plugin {
  let cssFile: { fileName: string; source: { toString(): string } } | undefined;
  return {
    name: "inline-css",
    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === "asset" && chunk.fileName.endsWith(".css")) {
          cssFile = chunk as { fileName: string; source: { toString(): string } };
        }
      }
    },
    transformIndexHtml: {
      order: "post",
      handler(html) {
        if (!cssFile) return html;
        const css = cssFile.source.toString();
        return html.replace(
          /<link rel="stylesheet"[^>]*href="[^"]*\.css"[^>]*>/,
          `<style>${css}</style>`,
        );
      },
    },
  };
}

/**
 * SITE_URL — the single source of truth for the production domain.
 * Set it in .env / the hosting environment; every canonical, og:url,
 * robots.txt and sitemap.xml is generated from it at build time.
 */
function siteUrlPlugin(siteUrl: string): Plugin {
  const outDir = path.resolve(import.meta.dirname, "dist", "public");

  return {
    name: "site-url",
    transformIndexHtml(html) {
      return html.replaceAll("{{SITE_URL}}", siteUrl);
    },
    closeBundle() {
      for (const file of ["robots.txt", "sitemap.xml"]) {
        const target = path.join(outDir, file);
        if (!fs.existsSync(target)) continue;
        fs.writeFileSync(target, fs.readFileSync(target, "utf-8").replaceAll("{{SITE_URL}}", siteUrl));
      }
    },
  };
}

/**
 * Injects the Umami analytics script into index.html at build time,
 * but only when both variables are configured (any self-hosted Umami works).
 * Without them the site ships with zero third-party scripts.
 */
function injectAnalytics(endpoint: string | undefined, websiteId: string | undefined): Plugin {
  return {
    name: "inject-analytics",
    transformIndexHtml(html, ctx) {
      if (!endpoint || !websiteId || ctx.server) return html;
      const tag = `\n    <script defer src="${endpoint}/umami" data-website-id="${websiteId}"></script>`;
      return html.replace("</body>", `${tag}\n  </body>`);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, "");
  const siteUrl = (env.SITE_URL || "https://arqa-kokshetau.kz").replace(/\/+$/, "");

  return {
    plugins: [
      react(),
      tailwindcss(),
      inlineCss(),
      siteUrlPlugin(siteUrl),
      injectAnalytics(env.VITE_ANALYTICS_ENDPOINT?.replace(/\/+$/, ""), env.VITE_ANALYTICS_WEBSITE_ID),
    ],
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
  };
});
