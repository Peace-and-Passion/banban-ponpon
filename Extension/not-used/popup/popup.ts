import App from './popup.svelte';
new App({ target: document.getElementById('root') as HTMLDivElement });
console.log('popup.ts')
// src/popup/popup.ts
export default function Popup() {
    console.log("Popup is loaded");
}
