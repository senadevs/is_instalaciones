/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    darkMode: ['class', '[data-theme="dark"]', '[data-theme="dark-green"]'], // Habilita temas oscuros con [data-theme]
    theme: {
      extend: {
        colors: {
          custom: {
            primary: '#046a53', // Verde claro
            secondary: '#156051',
            text: '#0d1e23',
            textLight: '#ffffff',
            background: '#ffffff',
          },
          darkGreen: {
            primary: '#0b443c', // Verde oscuro
            secondary: '#043c2c',
            text: '#000000',
            textLight: '#ffffff',
            background: '#ffffff',
            hover: '#263c04',
          },
          dark: {
            primary: '#0d1e23', // Tema oscuro
            secondary: '#1c343c',
            text: '#000000',
            textLight: '#ffffff',
            background: '#101920',
          },
        },
      },
    },
    plugins: [],
  };
  