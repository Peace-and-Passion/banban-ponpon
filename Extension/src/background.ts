import browser from 'webextension-polyfill';
import { detect } from 'detect-browser';
import * as conf from './conf';
import { sendMessage, onMessage } from 'webext-bridge/background';

console.log('background script running...');

/**
    Gets an access token from any of running Requestland in tabs.
  */
onMessage('getAccessTokenFromBackground', async () => {
    const tabs = await browser.tabs.query({ url: conf.originUri + '/*' });
    const promises = [];

    for (const tab of tabs) {
        const promise = (async () => {
            try {
                const response = await sendMessage('getAccessTokenFromContextScript', {}, `tab:${tab.id}`);
                return response;
            } catch (error) {
                console.error(`Failed to get AT from tab ${tab.id}:`, error);
                return null;
            }
        })();

        promises.push(promise);
    }

    const responses = await Promise.all(promises);
    const accessToken = responses.find(token => token !== null);

    return accessToken;
});

// browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   console.log('got message', message);
//   switch (message.type as BrowserMessageType) {
//     case 'gotColorScheme': {
//       updateIcon(message.value as ColorScheme).then(sendResponse);
//       return true;
//     }
//   }
// });

// async function updateIcon(colorScheme: ColorScheme) {
//   console.log('updating icon', colorScheme);
//   // do work here
// }
