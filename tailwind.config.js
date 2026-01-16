/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    'lg:grid-cols-5',
    'lg:col-span-2',
    'lg:col-span-1',
    'lg:col-span-3',
    'lg:row-span-2',
    'col-span-1',
    'min-h-[420px]',
    // Adicione mais classes se precisar (ex: 'backdrop-blur-lg')
  ],
}