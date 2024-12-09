import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Get port from environment variable or command line argument
const port = process.env.PORT || process.argv.includes('--port') 
  ? parseInt(process.argv[process.argv.indexOf('--port') + 1]) 
  : 5173;

export default defineConfig({
  plugins: [react()],
  server: {
    port: port,
  },
}); 