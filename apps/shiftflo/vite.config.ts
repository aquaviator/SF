import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react'; // <-- REMOVE THIS STATIC IMPORT

// Conditionally import the React plugin
let reactPlugin = [];
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'local') {
  // Use a dynamic import for the plugin itself
  // This ensures it's only loaded when explicitly in a dev/local environment
  // and won't be statically analyzed by esbuild for the production server bundle.
  // Note: This requires Node.js to support dynamic imports, which it does.
  import('@vitejs/plugin-react').then(module => {
    reactPlugin = [module.default()];
  }).catch(err => {
    console.warn('Failed to load @vitejs/plugin-react in non-development environment:', err.message);
    // In a production server context, this catch might not be strictly necessary
    // if the server itself doesn't need the plugin.
  });
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: reactPlugin, // Use the conditionally loaded plugin array
  // Add other Vite configurations as needed
  build: {
    // Ensure your build output directory is correct for your server to serve
    outDir: 'dist/public',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html', // Or your main entry HTML file
    },
  },
  server: {
    // This part is for local Vite dev server, not directly for Cloud Run server
    port: 5173, // Default Vite dev port
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
});
