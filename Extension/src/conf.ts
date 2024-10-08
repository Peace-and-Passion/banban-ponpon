export const D_ADDRESS_SEPARATOR = '//';
export const PasskeyCheckLoginTimeout = 62 * 1000;  // Login rentrance timeout: 62 sec
export const Passkey_Dialog_Timeout = 5*60;        // copied from conf.py
export const HTTP_FORBIDDEN = 403;         // Passkey server returns HTTP_FORBIDDEN
export const webExtID =  'chrome-extension://' + chrome.runtime.id;
export class NetworkError extends Error {}
//console.log(webExtID);

export let originUri: string;              // origin URI
export let apiURL: string;                 // API URL
export let isProduction: boolean = false;
declare const PRODUCTION: boolean;         // defined in vite.config.js
declare const BUILD_HOST: string;          // defined in vite.config.js
if (PRODUCTION) {
    isProduction = true;
    apiURL = originUri = "https://request.land";
} else {
    isProduction = false;
    apiURL = originUri = BUILD_HOST.startsWith('ppa-') ? 'https://' + BUILD_HOST + '.peace-and-passion.com' + ':50000' : "https://localhost:50000";
}
