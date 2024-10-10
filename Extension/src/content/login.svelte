<!--

     Banban Ponpon: Login

     @author Hirano Satoshi
     @copyright 2024 Peace and Passion
     @since 2024/10/02
-->

<script lang="ts">
 import browser from 'webextension-polyfill';
 import Modal from '../resources/Modal.svelte';
 import * as conf from '../conf';
 import Button from '../resources/button.svelte';
 import { sendMessage, onMessage } from 'webext-bridge/content-script';
 import { Passkey } from './passkey';
 import '../style.scss';

 let open     = false;
 const passkey = new Passkey();

 export function openLoginModal() {
     open = true;
 }

 /**
    Gets an access token from any of running Requestland in tabs, or open Login dialog.
  */
 export async function getAccessToken(): string {
     const accessToken: string|null = await sendMessage('getAccessTokenFromBackground', {}, 'background');
     if (accessToken) {
         console.log('Access Token found:', accessToken);
         return accessToken;
     } else {
         console.log('No tabs responded. Triggering login dialog.');
         return login();
     }
 }

 /**
    Login. NOT USED.
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
 onMessage('getAccessTokenFromContextScript', async () => {
     console.log('received getAccessTokenFromContextScript');

     // ask hm-app to send AT or null
     return new Promise<void>(async (resolve, reject) => {
         const observer = new MutationObserver((mutations) => {
             mutations.forEach((mutation) => {
                 const metaTag = document.querySelector('meta[name="accessToken"]');
                 if (metaTag) {
                     const accessToken = metaTag.getAttribute('content');
                     console.log('Access Token:', accessToken);
                     observer.disconnect();

                     resolve(accessToken === 'null' ? null : accessToken);
                 }
             });
         });

         // detect mutation of DOM
         observer.observe(document.head, { childList: true, subtree: true });

         window.postMessage('getAccessTokenFromPageScript', conf.originUri);
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
