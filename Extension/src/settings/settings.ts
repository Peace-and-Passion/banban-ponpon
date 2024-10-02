import App from './settings.svelte';
new App({ target: document.getElementById('root') as HTMLDivElement });

// src/popup/popup.ts
export default function Popup() {
    console.log("settings is loaded");
}
