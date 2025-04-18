import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

import react from '@astrojs/react';



import netlify from '@astrojs/netlify';



// https://astro.build/config
export default defineConfig({
  site: 'https://is-instalaciones.es',

  vite: {
    plugins: [tailwindcss()],
    define:{
      'process.env.GOOGLE_API_KEY': JSON.stringify(process.env.GOOGLE_API_KEY),
      'process.env.GOOGLE_PLACE_ID': JSON.stringify(process.env.GOOGLE_PLACE_ID),
    }
  },

  integrations: [sitemap(), react()],
  adapter: netlify(),
  output: 'server'
});