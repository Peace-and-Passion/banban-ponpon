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
                console.log('getAccessTokenFromBackground: sending getAccessTokenFromContextScript to ' + tab.id)
                const response = await sendMessage('getAccessTokenFromContextScript', {}, 'content-script@' + tab.id);
                console.log(`getAccessTokenFromBackground: got AT from tab ${tab.id}`);
                return response;
            } catch (error) {
                console.error(`getAccessTokenFromBackground: Failed to get AT from tab ${tab.id}:`, error);
                return null;
            }
        })();

        promises.push(promise);
    }

    const responses = await Promise.all(promises);
    console.log('getAccessTokenFromBackground: Promise.all end');
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
