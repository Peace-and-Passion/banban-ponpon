<!--

     Banban Ponpon: Login

     @author Hirano Satoshi
     @copyright 2024 Peace and Passion
     @since 2024/10/02
-->

<script lang="ts">
 import browser from 'webextension-polyfill';
// import { writable } from 'svelte/store';
 import Modal from '../resources/Modal.svelte';
 import * as conf from '../conf';
 import Button from '../resources/button.svelte';
 import { sendMessage, onMessage } from 'webext-bridge/content-script';
 import { Passkey, randomString } from './passkey';
 import '../style.scss';
 import type { UserInfo, UserInfoInquiry } from '../types';

 let open     = false;                // Modal open flat
 //export let userInfo = writable('');  // ローカルのストアとして userInfo をエクスポート
 export let userInfo: UserInfo;       // User info
 const passkey = new Passkey();       // Passkey authenticator

 export function openLoginModal() {
     open = true;
 }

 /**
    Gets an access token from any of running Requestland in tabs, or open Login dialog.
  */
 export async function getAccessToken(): string {
     const _userInfo: UserInfo|null = await sendMessage('getAccessTokenFromBackground', {}, 'background');
     if (_userInfo) {
         userInfo = _userInfo;
         //userInfo.set(_userInfo);
         console.log('Access Token found:', userInfo.at);
         return userInfo.at;
     } else {
         console.log('No tabs responded. Triggering login dialog.');
         return login();
     }
 }

 /**
    Open login dialog
  */
 async function login(): string {
     const accessToken = await passkey.authenticate({land_id_or_userID: undefined});
     //const accessToken = await passkey.authenticate({land_id_or_userID: 'hhh//h-com'});
     open = false;
     return accessToken;
 }


 /**
    Event handler for get accessToken from context script.
    Ask hm-app to set access token to DOM as <meta name="accessToken" description="alskjf09b8_flasj098bsf">.
    We detect the modification using MutationObserver and return it to the background script.

    Sender: Background script
    Receiver: Content script

    Return:  Access token.
  */
 onMessage('getUserInfo', async () => {
     console.log('received getUserInfo');

     // ask hm-app to send AT or null
     return new Promise<void>(async (resolve, reject) => {
         const returnEvent = randomString(10);

         const returnEventHandler = (event: CustomEvent) => {
             console.log('returnEventHandler: received ', event.detail);
             const userInfo: UserInfo|string = event.detail;
             document.removeEventListener(returnEvent, returnEventHandler);
             resolve(userInfo === 'null' ? null : userInfo);
         }
         document.addEventListener(returnEvent, returnEventHandler);
         const userInfoInquiry: UserInfoInquiry = {type: 'getUserInfo', returnEvent: returnEvent };
         window.postMessage(userInfoInquiry, conf.originUri);
     });
 });

</script>

<!-- NOT USED YET -->
<Modal isOpen={open} title="Sign in" onClose={() => {open = false}}>
  <div class="ponpon-center">
    <Button id="ponpon-signin-button" on:click={login}>
      Sign in
    </Button>
  </div>
</Modal>

<style>
 :global(#ponpon-signin-button) {
   background: #6AD8F0;
   color: white;
   font-size: 1rem;
   padding: 1.6em 28px;
 }
</style>
