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
 import type { ParsePageResult } from '../types_dummy';
 import { parseResponse } from './page_parser/parser/response-parser';
 import { ParsePageResult } from './page_parser/types';
 import Kitchen from '@smui/snackbar/kitchen';
 import * as conf from '../conf';
 import { loginProxy } from './login-proxy';
 import Login from './login.svelte';
 import 'svelte-material-ui/themes/svelte.css' // init Svelte Material UI with 'svelte' theme
 import '../style.scss';                       // load our global CSS

 console.log('content.svelte started on page: ' + window.location.origin);

 let isMain: boolean = true;                       // main script with the multi selectin button

 onMessage('parse', async () => {
     // if (window.location.origin == conf.originUri) {
     //     cancelSelectionMode();
     //     isMain = false;
     //     return;
     // }
     //
//     browser.storage.local.get({ [ `openedByBS_{tab.id}` });
     console.log('parse: start');
     // const parsePageResult: ParsePageResult = { title: document.title };       // YYY replace with page_parser
     const parsePageResult: ParsePageResult = await parseResponse(document, document.URL);
     window.close();
     return parsePageResult;
 });

 //
 // script for the selection mode button
 //

 let kitchen: Kitchen;                            // Pushable Snackbar
 let multiSelectButton;
 let isSelectionMode: boolean       = false;
 let buttonYPosition: number        = 50;
 let initialButtonYPosition: number = 50;
 let loginComponent;                              // Login component bound by <Login>
 // let accessToken: string;
 //let linkSnackbar: Snackbar;

 const linkClickHandler = async (event: ClickEvent) => {
     if (!isSelectionMode) return;

     event.preventDefault();
     event.stopPropagation();

     const clickedURL: string = event.target.closest('a')?.href;
     if (clickedURL) {
         //linkSnackbar.open(clickedURL);
         const parsePageResult: ParsePageResult = await sendMessage('openTab', { url: clickedURL }, 'background');
         //chrome.runtime.sendMessage({ type: 'openTab', url: clickedURL });

         await sendParsePageResult(parsePageResult, clickedURL);
         console.log('linkClickHandler: end');
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

 async function sendParsePageResult(parsePageResult: ParsePageResult, url: string) {
     try {
         console.log('getAccessToken: start');
         const accessToken = await loginComponent.getAccessToken();
         console.log('getAccessToken: end');

         console.log('sendParsePageResult: start');
	 const response = await fetch(conf.apiURL + "/v1/putCardExt", {
         // const response = await fetch("https://localhost:50000" + "/v1/putCardExt", {
	     method : "POST",
	     headers : {'Content-type' : 'application/x-www-form-urlencoded'},
             body: new URLSearchParams({
                 token: accessToken || '',
                 parse_page_results: JSON.stringify([parsePageResult]),
                 // url: JSON.stringify(url)
             }).toString()
	     // body : JSON.stringify({
             //     token: accessToken,
             //     parse_page_results: JSON.stringify(parsePageResult),
             //     url: JSON.stringify(url)
             // 	     })
         });
	 if (response.ok) {
             // pushToKitchen('putCard: ' + parsePageResult.title || 'OK');
             //console.log('sendParsePageResult: start');
         } else {
             const errorMsg = await response.text();
             // pushToKitchen('putCard: ' + errorMsg);
	     throw new Error("Connection error for " + conf.apiURL + ': ' + errorMsg);
	 }
     } catch (error) {
         // pushToKitchen('putCard: ' + error.toString());
	 console.log("sendParsePageResult: fetch() error: "+ error.toString());
     }
 }

 async function getAccessToken() {
     try {
         const accessToken = await loginComponent.getAccessToken();
         pushToKitchen('getAccessToken test: ' + accessToken);
     } catch (error) {
         pushToKitchen('putCard: ' + error.toString());
	 console.log("getAccessToken: fetch() error: "+ error.toString());
     }
 }

 export function pushToKitchen(msg: string) {
     kitchen.push({
         props: {  variant: 'stacked',  },
         label: msg,
         // actions: [
         //     {
         //         onClick: () => (action = 'Something'),
         //         text: 'Something',
         //     },
         //     {
         //         onClick: () => (action = 'Another'),
         //         text: 'Another',
         //     },
         // ],
         dismissButton: true,
         onDismiss: () => (action = 'Dismissed'),
         // onClose: (e) => {  reason = e.detail.reason ?? 'Undefined.';   },
     });
 }

 // enable selection mode if blank.html
 if (window.location.pathname.endsWith('blank.html')) {
     toggleSelectionMode();
 }

 // if request.land or dev server, stop showing the selection mode button
 if (window.location.origin == conf.originUri) {
     isMain = false;
     if (window.location.pathname == 'login-proxy-view') {
         loginProxy();
     }
 }

 // import backgrou.ts here though we don't use it, because 'input background.ts' does not work in vite.config.js.
 export let neverLoad = false;

 if (neverLoad) import('../background');
</script>

{#if isMain}
  <button id="ponpon-start-button" on:click={toggleSelectionMode}>
  </button>
{/if}

{#if isSelectionMode}
  <Button id="ponpon-done-button" on:click={cancelSelectionMode} variant="raised" class="ponpon-button-shaped-round">
    <Label>Done</Label>
  </Button>

  <!-- <Button id="ponpon-at-button" on:click={getAccessToken} variant="outlined" class="ponpon-button-shaped-round">
       <Label>Get Access Token</Label>
       </Button>
  -->
  <Label id="ponpon-env-button" >{conf.apiURL}</Label>
{/if}

<Kitchen bind:this={kitchen} dismiss$class="material-icons" />

<Login bind:this={loginComponent} />

<style>
 @use './login.sccs';
 :global(#ponpon-start-button) {
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

 :global(#ponpon-done-button) {
   position: fixed;
   top: 78px;
   left: 18px;
   z-index: 10000;
   /* border-radius: 50px; */
 }
 :global(#ponpon-at-button) {
   position: fixed;
   top: 176px;
   left: 18px;
   z-index: 10000;
   background-color: white;
 }
 :global(#ponpon-env-button) {
   position: fixed;
   top: 56px;
   left: 26px;
   z-index: 10000;
   /* padding: 6px 1rem; */
   /* border: 1px solid #e0e0e0;
      border-radius: 6px; */
   /* background-color: white; */
   font-size: 7px;
 }
</style>
