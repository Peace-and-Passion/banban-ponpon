import { defineManifest } from '@crxjs/vite-plugin'
import packageData from './package.json'

//@ts-ignore
const isDev = process.env.NODE_ENV == 'development'

export default defineManifest({
    name: `${packageData.displayName || packageData.name}${isDev ? ` ➡️ Dev` : ''}`,
    description: packageData.description,
    version: packageData.version,
    manifest_version: 3,
    icons: {
        "16": "images/icon16.png",
        "32": "images/icon32.png",
        "48": "images/icon48.png",
        "96": "images/icon48@2x.png",
        "128": "images/icon128.png",
        "144": "images/icon48@3x.png"
    },
    action: {
        default_popup: 'popup.html',
        "default_icon": {
            "16": "images/icon16.png",
            "32": "images/icon32.png",
            "48": "images/icon48.png",
            "96": "images/icon48@2x.png",
            "128": "images/icon128.png",
            "144": "images/icon48@3x.png"
        }
    },
    options_page: 'settings.html',
    background: {
        service_worker: 'src/background.ts',
        type: 'module',
    },
    content_scripts: [
        {
            js: ["src/content.ts"],
            matches: ["*://*/*", "file://*/*"],
            run_at: "document_idle"     // run after building DOM
        },
    ],
    permissions: ['storage'],
    host_permissions: [],

    browser_specific_settings: {
        gecko: {
            id: "REPLACEME"
        }
    }
})
