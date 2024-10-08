export const D_ADDRESS_SEPARATOR = '//';
export const PasskeyCheckLoginTimeout = 62 * 1000;  // Login rentrance timeout: 62 sec
export const Passkey_Dialog_Timeout = 5*60;        // copied from conf.py
export const HTTP_FORBIDDEN = 403;         // Passkey server returns HTTP_FORBIDDEN
export const webExtID =  'chrome-extension://' + chrome.runtime.id;
//console.log(webExtID);

declare const PRODUCTION: boolean;         // defined in vite.config.js
declare const BUILD_HOST: string;          // defined in vite.config.js
export let originUri = "https://request.land";
if (!PRODUCTION) {
    if (BUILD_HOST.startsWith('ppa-')) {
        originUri = 'https://' + BUILD_HOST + '.peace-and-passion.com' + ':50000';
    } else {
        originUri = "https://localhost:50000";
    }
}
export const apiURL = originUri;
export class NetworkError extends Error {}
