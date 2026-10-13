// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://tools.tommyfx.pk",
  redirects: {
    // Category hub retired - open the sitewide tools drawer instead.
    "/categories": "/?tools=1",
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    react(),
    sitemap({
      // Exclude noindex stubs / unfinished demos from the public sitemap.
      filter: (page) => !page.includes("/tools/template-demo"),
    }),
  ],
});
