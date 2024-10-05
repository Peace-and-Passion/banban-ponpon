<!--

     Banban Ponpon: Browser extension for Banban board

     @author Hirano Satoshi
     @copyright 2024 Peace and Passion
     @since 2024/10/02
-->

<script lang="ts">
 import browser from 'webextension-polyfill';
 import Dialog, { Title, Content, Actions } from '@smui/dialog';
 import * as conf from '../conf';
 import Button, { Label } from '@smui/button';
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
     const accessToken: string = await sendMessage('getAccessTokenFromBackground', {}, 'background');
     if (accessToken) {
         console.log('Access Token found:', accessToken);
         return accessToken;
     } else {
         console.log('No tabs responded. Triggering login dialog.');
         return login();
     }
 }

 //
 //      function openLoginDialog() {
 //          browser.tabs.create({
 //              url: 'https://request.land/passkey-proxy',
 //              active: true
 //          });
 //      }
 //browser.cookies.Cookie.get('');

 async function login(): string {
     const accessToken = await passkey.authenticate({land_id_or_userID: 'hhh//h-com'});
     open = false;
     return accessToken;
 }


 // Receive getAt and return AT.
 onMessage('getAccessTokenFromContextScript', async () => {
     console.log('received getAccessTokenFromContextScript');

     // ask hm-app to send AT or null
     return new Promise<void>(async (resolve, reject) => {
         // const handler = async (event) => {
         //     console.log('received ' + String(event));
         //
         //     // if (event.origin === conf.webExtID && event.source == window && event.data.type === 'answerAccessTokenFromPageScript') {
         //     //     resolve(event.data.value);
         //     //     window.removeEventListener('message', handler);
         //     //     return;
         //     // }
         // }
         //
         // window.addEventListener('message', handler);
         //
         const observer = new MutationObserver((mutations) => {
             mutations.forEach((mutation) => {
                 const metaTag = document.querySelector('meta[name="accessToken"]');
                 if (metaTag) {
                     const accessToken = metaTag.getAttribute('content');
                     console.log('Access Token:', accessToken);
                     observer.disconnect(); // アクセストークンを取得したら監視を停止
                     resolve(accessToken);
                 }
             });
         });

         // DOMの変化を監視
         observer.observe(document.head, { childList: true, subtree: true });

         window.postMessage('getAccessTokenFromPageScript', conf.originUri);
     });
 });

</script>

<Dialog
    bind:open
    aria-labelledby="simple-title"
    aria-describedby="simple-content"
>
  <Title id="simple-title">Sign in</Title>
  <Content id="simple-content">
    <div class="center">
      <div class="large-vspace"></div>
      <Button id="signin-button" on:click={login} variant="raised" class="button-shaped-round">
        Sign in
      </Button>
    </div>
  </Content>
</Dialog>

<style>
 :global(#signin-button) {
   background: #6AD8F0;
   color: white;
   font-size: 1rem;
   padding: 1.6em 28px;
 }
</style>
