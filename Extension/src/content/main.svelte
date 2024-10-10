<!--

     Banban Ponpon: The main entry point of browser extension for Banban board

     @author Hirano Satoshi, Togashi Ayuto
     @copyright 2024 Peace and Passion
     @since 2024/10/02
-->

<script lang="ts">
 import browser from 'webextension-polyfill';
 import { sendMessage, onMessage } from 'webext-bridge/content-script';
 import { _, locale, init, addMessages, getLocaleFromNavigator } from 'svelte-i18n';

 import Button from '../resources/button.svelte';
 import Modal from '../resources/Modal.svelte';
 import Toast from '../resources/toast';
 import { parseResponse } from './page_parser/parser/response-parser';
 import { ParsePageResult } from './page_parser/types';
 import * as conf from '../conf';
 import { loginProxy } from './login-proxy';
 import Login from './login.svelte';
 import '../style.scss';                       // load our global CSS

 console.log('content.svelte started on page: ' + window.location.href);

 // initialize locales
 import en from '../../locales/en.json';
 import ja from '../../locales/ja.json';
 addMessages('en', en);
 addMessages('ja', ja);
 // add new locale here
 init({
     fallbackLocale: 'en',
     initialLocale: getLocaleFromNavigator().split('-')[0]?.toLowerCase()
 });


 let isMain: boolean                = true;       // main script with the multi selectin button
 let multiSelectButton: Button;
 let isSelectionMode: boolean       = false;
 let buttonYPosition: number        = 50;
 let initialButtonYPosition: number = 50;
 let loginComponent;                              // Login component bound by <Login>

 /** Toggles selection mode */
 function toggleSelectionMode() {
     if (isSelectionMode) {
         cancelSelectionMode();
     } else {
         isSelectionMode = true;

         document.addEventListener('click', linkClickHandler);
     }
 }

 /** Cancel selection mode. */
 function cancelSelectionMode() {
     isSelectionMode = false;

     document.removeEventListener('click', linkClickHandler);
 }

 /** Click handler for links to add titles, prices... */
 const linkClickHandler = async (event: ClickEvent) => {
     if (!isSelectionMode) return;

     event.preventDefault();
     event.stopPropagation();

     const clickedURL: string = event.target.closest('a')?.href;
     if (clickedURL) {
         const parsePageResult: ParsePageResult = await sendMessage('openPageOnTab', { url: clickedURL }, 'background');

         await sendParsePageResult(parsePageResult, clickedURL);
         console.log('linkClickHandler: end');
     }
 }

 /** Send a parsed page result to a Banban Board. */
 async function sendParsePageResult(parsePageResult: ParsePageResult, url: string) {
     try {
         console.log('getAccessToken: start');
         const accessToken = await loginComponent.getAccessToken();
         console.log('getAccessToken: end');

         console.log('sendParsePageResult: start');
	 const response = await fetch(conf.apiURL + "/v1/putCardExt", {
	     method : "POST",
	     headers : {'Content-type' : 'application/x-www-form-urlencoded'},
             body: new URLSearchParams({
                 token: accessToken || '',
                 parse_page_results: JSON.stringify([parsePageResult]),
             }).toString()
	     // body : JSON.stringify({
             //     token: accessToken,
             //     parse_page_results: JSON.stringify(parsePageResult),
             //     url: JSON.stringify(url)
             // 	     })
         });
	 if (response.ok) {
             Toast.show('Added: ' + parsePageResult.title || 'OK');
         } else {
             const errorMsg = await response.text();
             if (!conf.isProduction) Toast.show('putCard: ' + errorMsg);
	     throw new Error("Connection error for " + conf.apiURL + ': ' + errorMsg);
	 }
     } catch (error) {
         if (!conf.isProduction)  Toast.show('putCard: ' + error.toString());
	 console.log("sendParsePageResult: fetch() error: "+ error.toString());
     }
 }

 /* Get access token for test only. */
 async function getAccessToken() {
     try {
         const accessToken = await loginComponent.getAccessToken();
         Toast.show('getAccessToken test: ' + accessToken);
     } catch (error) {
         Toast.show('putCard: ' + error.toString());
	 console.log("getAccessToken: fetch() error: "+ error.toString());
     }
 }

 /* Parse DOM and return title and price information.

    Sender: Background script
    Receiver: Content script

    Return:  ParsePageResult.
  */
 onMessage('parsePage', async () => {
     console.log('parsePage: start');
     const parsePageResult: ParsePageResult = await parseResponse(document, document.URL);
     window.close();
     return parsePageResult;
 });

 // enable selection mode if blank.html
 if (window.location.pathname.endsWith('blank.html')) {
     toggleSelectionMode();
 }

 // if request.land or dev server, stop showing the selection mode button
 if (window.location.origin == conf.originUri) {
     isMain = false;

     // currently this does nothing
     if (window.location.pathname == 'login-proxy-view') {
         loginProxy();
     }
 }

</script>

{#if isMain}
  <!-- Start button -->
  <button id="ponpon-start-button" on:click={toggleSelectionMode}>
  </button>
{/if}


{#if isSelectionMode}
  <!-- Header -->
  <div class="header">
    <h3>{$_('title')}</h3>
  </div>

  <!-- Done button -->
  <Button id="ponpon-done-button" label="Done"
          on:click={cancelSelectionMode}>
  </Button>

  {#if !conf.isProduction}
    <!-- API URL -->
    <div id="ponpon-env-button" >{conf.apiURL}</div>

    <!-- Get Access Token button -->
    <Button id="ponpon-at-button" on:click={getAccessToken} variant="outlined">
      Get Access Token
    </Button>
  {/if}
{/if}


<Login bind:this={loginComponent} />

<style>
 .header {
   position: fixed;
   width: 100px;
   top: 4px;
   left: 50%;
   transform: translateX(-50%);
 }
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
