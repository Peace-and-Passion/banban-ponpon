import browser from 'webextension-polyfill';
import * as conf from './conf';
import { sendMessage, onMessage } from 'webext-bridge/background';
import type { ParsePageResult } from './types_dummy';
// export interface ParsePageResult {
//      title: string;
//  }

console.log('background script running...');

onMessage('openTab', async ({ data }) => {
    // Define a Promise to wait for the tab to load completely
    let tabPromise = new Promise<browser.Tabs.Tab>((resolve) => {
        browser.tabs.onUpdated.addListener(function listener(_tabId, changeInfo: browser.Tabs.OnUpdatedChangeInfoType, tab) {
            // Check if the updated tab has the target URL and is fully loaded
            if (tab.url === data.url && changeInfo.status === 'complete') {
                // Remove the listener and resolve the Promise with the tab info
                browser.tabs.onUpdated.removeListener(listener);
                resolve(tab);
            }
        });
    });

    // Create a new inactive tab with the target URL
    const tab = await browser.tabs.create({ url: data.url, active: false });

    // Wait for the tab to load completely
    const completedTab = await tabPromise;

    // Send a message to the content script in the completed tab
    console.log(`Tab ${completedTab.id} is completed. Sending parse`);
    const result = await sendMessage('parse', {}, 'content-script@' + completedTab.id);

    return result;
});

/**
    Gets an access token from any of running Requestland in tabs.
  */
onMessage('getAccessTokenFromBackground', getAccessTokenFromTab);

export async function getAccessTokenFromTab() {
    const tabs = await browser.tabs.query({ url: conf.originUri + '/*' });
    const promises = [];

    for (const tab of tabs) {
        const promise = (async () => {
            try {
                console.log('getAccessTokenFromBackground: sending getAccessTokenFromContextScript to ' + tab.id)
                const accessToken = await sendMessage('getAccessTokenFromContextScript', {}, 'content-script@' + tab.id);
                console.log(`getAccessTokenFromBackground: got AT ${accessToken} from tab ${tab.id}`);
                return accessToken;
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
}
