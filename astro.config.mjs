// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";


// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  output: 'server',  // Enable server-side rendering
  server: {
    port: 4322
  },
});
