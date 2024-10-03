import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import sveltePreprocess from 'svelte-preprocess';
import manifest from './manifest';
import os from 'os';

export default defineConfig(({ mode }) => {
    const production = mode === 'production';

    return {
        build: {
            emptyOutDir: true,
            outDir: 'dist',
            rollupOptions: {
                input: {
                    content: './src/content.ts',
                    background: './src/background.ts',
                    popup: './src/popup/popup.ts',
                    settings: './src/settings/settings.ts'
                },
                output: {
                    entryFileNames: '[name].js', // 出力ファイル名を指定
                    chunkFileNames: 'assets/chunk-[hash].js',
                },
            },
        },
        plugins: [
            crx({ manifest }),
            svelte({
                compilerOptions: {
                    dev: !production,
                },
                preprocess: sveltePreprocess(),
            }),
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src'),
            },
        },
        define: {
            PRODUCTION: JSON.stringify(production),
            BUILD_HOST: JSON.stringify(os.hostname())
        }
    };
});
