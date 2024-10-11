/**
     Banban Ponpon: Background script

     @author Hirano Satoshi
     @copyright 2024 Peace and Passion
     @since 2024/10/10
 */
import browser from 'webextension-polyfill';
import { sendMessage, onMessage } from 'webext-bridge/background';
import * as conf from './conf';

console.log('background script running...');

/* Open a page on a tab to get its title and price information.

   Sender: Content script
   Receiver: Background script

   Param:   url A URL to open.
   Return:  ParsePageResult.
 */
onMessage('openPageOnTab', async ({ data }) => {
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
    const completedTab: browser.Tabs.Tab = await tabPromise;

    // Send a message to the content script in the completed tab
    console.log(`Tab ${completedTab.id} is completed. Sending parse`);
    const result = await sendMessage('parsePage', {}, 'content-script@' + completedTab.id);

    return result;
});

/**
 Gets an access token from any of running Requestland in tabs.

 Sender: Content script
 Receiver: Background script

 Return:  Access token.
  */
onMessage('getAccessTokenFromBackground', getAccessTokenFromTab);

export async function getAccessTokenFromTab(): Promise<string|null> {
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
    let accessToken: string|null|undefined = responses.find(token => token !== null);
    if (accessToken == undefined) accessToken = null;

    return accessToken;
}
