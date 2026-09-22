import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages serves project sites from /<repo>/, so built assets must be prefixed.
  // Keep '/' for the dev server so `npm run dev` works at the root as usual.
  base: command === 'build' ? '/Drinklyy/' : '/',
  plugins: [react()],
}))
