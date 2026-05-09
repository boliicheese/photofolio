import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  publicDir: false,
  build: {
    outDir: resolve(__dirname, 'public/dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'client/js/main.js'),
        upload: resolve(__dirname, 'client/js/upload.js'),
        admin: resolve(__dirname, 'client/js/admin.js'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-chunk.js',
        assetFileNames: '[name][extname]',
      },
    },
  },
});
