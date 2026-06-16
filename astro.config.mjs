import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

import react from '@astrojs/react';



import netlify from '@astrojs/netlify';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  site: 'https://is-instalaciones.es',

  vite: {
    plugins: [tailwindcss()],
    define:{
      'process.env.GOOGLE_API_KEY': JSON.stringify(process.env.GOOGLE_API_KEY),
      'process.env.GOOGLE_PLACE_ID': JSON.stringify(process.env.GOOGLE_PLACE_ID),
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.js'],
    },
    // Permite exponer el dev server por túneles (ngrok) para enseñar el proyecto.
    // El punto inicial autoriza cualquier subdominio, aunque cambie al reiniciar.
    server: {
      allowedHosts: ['.ngrok-free.app', '.ngrok.app', '.ngrok.io'],
    },
  },

  integrations: [sitemap(), react(), icon()],
  adapter: netlify(),
  output: 'server'
});
