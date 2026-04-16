import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
    allowedHosts: ['untremulent-madaline-symbolically.ngrok-free.dev', 'shrug-anyway-silicon.ngrok-free.dev']
  }
})