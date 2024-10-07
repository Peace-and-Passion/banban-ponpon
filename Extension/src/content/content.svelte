<!--

     Banban Ponpon: Browser extension for Banban board

     @author Hirano Satoshi, Togashi Ayuto
     @copyright 2024 Peace and Passion
     @since 2024/10/02
-->

<script lang="ts">
 import browser from 'webextension-polyfill';
 import { sendMessage, onMessage } from 'webext-bridge/content-script';
 import Button, { Label } from '@smui/button';
 // import { parseResponse } from './page_parser/parser/response-parser';
 //import { ParsePageResult } from './page_parser/types';
 import Snackbar, { Actions } from '@smui/snackbar';
 import * as conf from '../conf';
 import { loginProxy } from './login-proxy';
 import Login from './login.svelte';
 import 'svelte-material-ui/themes/svelte.css' // init Svelte Material UI with 'svelte' theme
 import '../style.scss';                       // load our global CSS

 console.log('content.svelte started on page: ' + window.location.origin);

 interface ParsePageResult {
     title: string;
 }

 //
 // purpose dispatcher
 //
 async function dispatch() {
     if (window.location.origin == conf.originUri) {
         if (window.location.pathname == 'login-proxy-view') {
             loginProxy();
             return;
         }
     } else {
         //
     }
 }

 onMessage('parse', async () => {
     console.log('parse: start');
     const parsePageResult: ParsePageResult = { title: "hello" };
     //const parsePageResult: ParsePageResult = await parseResponse();
     console.log('parse: end');

     sendParsePageResult(parsePageResult);
 });

 //
 // script for the selection mode button
 //

 let multiSelectButton;
 let isSelectionMode: boolean       = false;
 let buttonYPosition: number        = 50;
 let initialButtonYPosition: number = 50;
 let loginComponent;                              // Login component bound by <Login>
 let accessToken: string;
 let clickedURL: string;
 let accessTokenSnackbar: Snackbar;
 let linkSnackbar: Snackbar;

 const linkClickHandler = (event: ClickEvent) => {
     if (!isSelectionMode) return;

     event.preventDefault();
     event.stopPropagation();

     clickedURL = event.target.closest('a')?.href;
     if (clickedURL) {
         linkSnackbar.open(clickedURL);
         sendMessage('openTab', { url: clickedURL }, 'background');
         //chrome.runtime.sendMessage({ type: 'openTab', url: clickedURL });
     }
 }

 // Toggles selection mode
 function toggleSelectionMode() {
     if (isSelectionMode) {
         cancelSelectionMode();
     } else {
         isSelectionMode = true;

         document.addEventListener('click', linkClickHandler);
     }
 }

 function cancelSelectionMode() {
     isSelectionMode = false;

     document.removeEventListener('click', linkClickHandler);
 }

 async function getAccessToken() {
     console.log('getAccessToken: start');
     accessToken = await loginComponent.getAccessToken();
     accessTokenSnackbar.open();
     console.log('getAccessToken: end');
 }

 async function sendParsePageResult(parsePageResult: ParsePageResult) {
     try {
         const accessToken = await getAccessToken();

         console.log('sendParsePageResult: start');
	 const response = await fetch(conf.apiUrl + "/v1/putCardExt", {
	     method : "POST",
	     headers : {'Content-type' : 'application/x-www-form-urlencoded'},
	     body : `token=${accessToken}, parse_page_results=[${JSON.stringify(parsePageResult)}]`
	 });
	 if (response.ok) {
             console.log('sendParsePageResult: start');
         } else {
             const errorMsg = await response.text();
	     throw new Error("Connection error for " + conf.apiUrl + ': ' + errorMsg);
	 }
     } catch (error) {
	 console.log("sendParsePageResult: fetch() error: "+ error.toString());
     }
 }
 // toggleSelectionMode(); // for test

 // start the content script
 dispatch();

 // import backgrou.ts here though we don't use it, because 'input background.ts' does not work in vite.config.js.
 export let neverLoad = false;

 if (neverLoad) import('../background');
</script>

<button id="start-button" on:click={toggleSelectionMode}>
</button>

{#if isSelectionMode}
  <Button id="done-button" on:click={cancelSelectionMode} variant="raised" class="button-shaped-round">
    <Label>Done</Label>
  </Button>

  <Button id="login-button" on:click={getAccessToken} variant="outlined" class="button-shaped-round">
    <Label>Get Access Token</Label>
  </Button>

  <!-- <Button id="login-button" on:click={loginComponent.openLoginModal} variant="outlined" class="button-shaped-round">
       <Label>Login</Label>
       </Button> -->
{/if}

<Snackbar bind:this={accessTokenSnackbar} timeoutMs={4000}>
  <Label>{accessToken}</Label>
</Snackbar>

<Snackbar bind:this={linkSnackbar} timeoutMs={4000}>
  <Label>{clickedURL}</Label>
</Snackbar>

<Login bind:this={loginComponent} />

<style>
 @use './login.sccs';
 :global(#start-button) {
   position: fixed;
   top: 50px;
   left: 0;
   width: 20px;
   height: 30px;
   border-radius: 0 50px 50px 0;
   overflow: hidden;
   padding: 0;
   border: none;
   background-color: red;
   z-index: 10000;
   cursor: pointer;
 }

 :global(#done-button) {
   position: fixed;
   top: 78px;
   left: 18px;
   z-index: 10000;
   /* border-radius: 50px; */
 }
 :global(#login-button) {
   position: fixed;
   top: 130px;
   left: 18px;
   z-index: 10000;
 }
</style>
