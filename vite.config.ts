import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'react-native': path.resolve(__dirname, './src/shim/react-native.tsx'),
        'expo-av': path.resolve(__dirname, './src/shim/expo-av.ts'),
        'expo-document-picker': path.resolve(__dirname, './src/shim/expo-document-picker.ts'),
        'expo-file-system': path.resolve(__dirname, './src/shim/expo-file-system.ts'),
        'react-native-safe-area-context': path.resolve(__dirname, './src/shim/safe-area.tsx'),
        '@expo/vector-icons': path.resolve(__dirname, './src/shim/vector-icons.tsx'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
