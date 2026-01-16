/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'grid-cols-1',
    'grid-cols-5',
    'col-span-1',
    'col-span-2',
    'lg:col-span-2',
    'min-h-[420px]',
    'backdrop-blur-lg',
    'shadow-2xl',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // Temporário: desativa purge pra forçar todas classes (depois volta pra true)
  future: {
    purgeLayersByDefault: false,
  },
}