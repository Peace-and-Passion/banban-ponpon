/**
     Banban Ponpon: Build configration

     @author Hirano Satoshi
     @copyright 2024 Peace and Passion
     @since 2024/10/10
 */
import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import sveltePreprocess from 'svelte-preprocess';
import manifest from './manifest';
import os from 'os';

export default defineConfig(({ mode }) => {
    const production = mode === 'production';
    const browser = process.env.BROWSER || 'chrome';

    return {
        build: {
            emptyOutDir: true,
            outDir: 'dist',
            sourcemap: mode === 'production' ? false: 'inline',
            // we don't need rollupOptions here
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
        css: {
            // this stops deprecation warning
            preprocessorOptions: {
                scss: {
                    api: "modern-compiler",
                },
                sass: {
                    api: "modern-compiler",
                },
            },
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src'),
            },
        },
        define: {
            PRODUCTION: JSON.stringify(production),
            BUILD_HOST: JSON.stringify(os.hostname()),
            BROWSER: JSON.stringify(browser),
        }
    };
});
