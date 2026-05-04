// ─────────────────────────────────────────────────────────────────────────────
// Vite build configuration for BrainBoost frontend.
//
// Vite is the build tool and dev server.
// The @vitejs/plugin-react plugin enables:
//   - Fast Refresh (hot-module replacement) for React components during development.
//   - JSX transform so React does not need to be explicitly imported in every .jsx file.
//
// For additional configuration options see: https://vite.dev/config/
// ─────────────────────────────────────────────────────────────────────────────
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
