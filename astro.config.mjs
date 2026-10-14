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
      // Index-worthy URLs only (T08-01). Stubs, demos, and redirect shells stay out.
      filter: (page) => {
        if (page.includes("/tools/template-demo")) return false;
        if (page.includes("/categories")) return false;
        return true;
      },
    }),
  ],
});
