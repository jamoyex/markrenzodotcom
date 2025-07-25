import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    server: {
        host: '0.0.0.0', // Allow external hosts
        port: 5173,
        allowedHosts: [
            'localhost',
            '127.0.0.1',
            '8a571a58b4de.ngrok-free.app',
            '2f0dd302442f.ngrok-free.app'
        ]
    }
});
