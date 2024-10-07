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
 // import { parseResponse } from './page_parser/parser/response-parser';
 //import { ParsePageResult } from './page_parser/types';
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
     const parsePageResult: ParsePageResult = { title: document.title };       // YYY replace with page_parser
     //const parsePageResult: ParsePageResult = await parseResponse();
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

	 showHaloEffect(event) //Halo effect
	 
         //linkSnackbar.open(clickedURL);
         const parsePageResult: ParsePageResult = await sendMessage('openTab', { url: clickedURL }, 'background');
         //chrome.runtime.sendMessage({ type: 'openTab', url: clickedURL });

         await sendParsePageResult(parsePageResult, clickedURL);
         console.log('linkClickHandler: end');
     }
 }

 
 // Save Button Position to LocalStorage
 function saveButtonPosition(position) {
     localStorage.setItem('toggleButtonPosition', JSON.stringify(position));
 }

 // Get Button Position from LocalStorage
 function getSavedButtonPosition() {
     const position = localStorage.getItem('toggleButtonPosition');
     return position ? JSON.parse(position) : { top: 50 };
 }

 // Restore Button Position
 function restoreButtonPosition() {
     const savedPosition = getSavedButtonPosition();
     const toggleButton = document.getElementById('ponpon-start-button');
     if (toggleButton) {
        toggleButton.style.top = `${savedPosition.top}px`;
     }
     adjustButtonPositions(savedPosition.top);
 }

 // Adjust Sub Buttons Position
 function adjustButtonPositions(topPosition) {
     const cancelButton = document.getElementById('ponpon-done-button');
     const loginButton = document.getElementById('ponpon-login-button');
     if (!cancelButton || !loginButton) {
	 return;
     }
     const pageHeight = window.innerHeight;
     const isUpperHalf = topPosition < pageHeight / 2;

     if (isUpperHalf) {
         cancelButton.style.top = `${topPosition + 28}px`;
         loginButton.style.top = `${topPosition + 80}px`;
     } else {
         cancelButton.style.top = `${topPosition - 50}px`;
         loginButton.style.top = `${topPosition - 2}px`;
     }
 }

 // Draggable Button Position
 function makeButtonDraggable(button) {
     let isDragging = false;
     let offsetY;

     button.addEventListener('mousedown', (e) => {
         isDragging = true;
         offsetY = e.clientY - button.getBoundingClientRect().top;
         document.addEventListener('mousemove', onMouseMove);
         document.addEventListener('mouseup', onMouseUp);
     });

     function onMouseMove(e) {
         if (isDragging) {
             button.style.top = `${e.clientY - offsetY}px`;
             adjustButtonPositions(button.getBoundingClientRect().top);
         }
     }

     function onMouseUp() {
         isDragging = false;
         document.removeEventListener('mousemove', onMouseMove);
         document.removeEventListener('mouseup', onMouseUp);

         saveButtonPosition({
             top: button.getBoundingClientRect().top,
         });
     }
 }

 window.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('ponpon-start-button');
    if (toggleButton) {
        makeButtonDraggable(toggleButton);
	console.log('toggleButton found, draggable initialized');
    }
     restoreButtonPosition();
 });
 
 // Toggles selection mode
 function toggleSelectionMode() {
     if (isSelectionMode) {
         cancelSelectionMode();
     } else {
         isSelectionMode = true;

	 const toggleButton = document.getElementById('ponpon-start-button');
         adjustButtonPositions(toggleButton.getBoundingClientRect().top);
	 
         document.addEventListener('click', linkClickHandler);
     }
 }

 function cancelSelectionMode() {
     isSelectionMode = false;

     document.removeEventListener('click', linkClickHandler);
 }


 //Halo Effect Define
 function showHaloEffect(event: MouseEvent) {
     const halo = document.createElement('div');
     halo.classList.add('halo-effect');
  
     document.body.appendChild(halo);
     halo.style.left = `${event.pageX - 5}px`;
     halo.style.top = `${event.pageY - 5}px`;

     halo.addEventListener('animationend', () => {
	 halo.remove();
     });
 }
 
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
                 // url: JSON.stringify(url)
             }).toString()
	     // body : JSON.stringify({
             //     token: accessToken,
             //     parse_page_results: JSON.stringify(parsePageResult),
             //     url: JSON.stringify(url)
             // 	     })
         });
	 if (response.ok) {
             pushToKitchen('putCard: ' + parsePageResult.title || 'OK');
             //console.log('sendParsePageResult: start');
         } else {
             const errorMsg = await response.text();
             pushToKitchen('putCard: ' + errorMsg);
	     throw new Error("Connection error for " + conf.apiURL + ': ' + errorMsg);
	 }
     } catch (error) {
         pushToKitchen('putCard: ' + error.toString());
	 console.log("sendParsePageResult: fetch() error: "+ error.toString());
     }
 }

 async function getAccessToken() {
     const accessToken = await loginComponent.getAccessToken();
     pushToKitchen('getAccessToken test: ' + accessToken);
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

  <Button id="ponpon-login-button" on:click={getAccessToken} variant="outlined" class="ponpon-button-shaped-round">
      <Label>Get Access Token</Label>
  </Button>

  <!-- <Button id="ponpon-login-button" on:click={loginComponent.openLoginModal} variant="outlined" class="ponpon-button-shaped-round">
       <Label>Login</Label>
       </Button> -->
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
 :global(#ponpon-login-button) {
     position: fixed;
     top: 130px;
     left: 18px;
     z-index: 10000;
 }
 :global(.halo-effect) {
     position: absolute;
     border-radius: 50%;
     background: rgba(255, 0, 5, 0.5);
     width: 10px;
     height: 10px;
     animation: halo-animation 0.6s ease-out forwards;
     pointer-events: none;
     z-index: 9999;
 }

 @keyframes halo-animation {
     0% {
	 transform: scale(0);
	 opacity: 1;
     }
     100% {
	 transform: scale(15);
	 opacity: 0;
     }
 }
</style>
