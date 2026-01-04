import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(env.API_KEY),
        'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
        'process.env.SUPABASE_SERVICE_KEY': JSON.stringify(env.SUPABASE_SERVICE_KEY),
        'process.env.RESEND_API_KEY': JSON.stringify(env.RESEND_API_KEY),
        'process.env.GMAIL_USER': JSON.stringify(env.GMAIL_USER),
        'process.env.GMAIL_PASS': JSON.stringify(env.GMAIL_PASS),
        'process.env.WATCHED_DIR': JSON.stringify(env.WATCHED_DIR),
        // Legacy aliases for backward compatibility
        'process.env.API_KEY': JSON.stringify(env.API_KEY),
        'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
        'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_SERVICE_KEY),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});