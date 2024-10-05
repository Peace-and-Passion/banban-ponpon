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
     const accessToken = 'abc'; // await getAccessTokenFromSomewhere(); // 実際のアクセストークン取得処理
     return { value: accessToken };
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
