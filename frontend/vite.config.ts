import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
  server: {
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/three")) return "three";
          if (id.includes("node_modules/maplibre-gl")) return "maplibre";
          if (id.includes("node_modules/echarts")) return "echarts";
          return undefined;
        },
      },
    },
  },
})
