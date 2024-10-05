<!--

     Banban Ponpon: Browser extension for Banban board

     @author Hirano Satoshi, Togashi Ayuto
     @copyright 2024 Peace and Passion
     @since 2024/10/02
-->

<script lang="ts">
 import Button, { Label } from '@smui/button';
 import * as conf from '../conf';
 import { loginProxy } from './login-proxy';
 import Login from './login.svelte';
 import 'svelte-material-ui/themes/svelte.css' // init Svelte Material UI with 'svelte' theme
 import '../style.scss';                       // load our global CSS

 console.log('content.svelte started on page: ' + window.location.origin);

 //
 // purpose dispatcher
 //
 if (window.location.origin == conf.originUri) {
     if (window.location.pathname == 'login-proxy-view') {
         loginProxy();
     }
 } else {
     // other sites

     //XXX catch a message here from the background script for parsing DOM
     // otherwise, act as the master script.
 }

 //
 // script for the selection mode button
 //

 let multiSelectButton;
 let isSelectionMode: boolean       = false;
 let clickTrackEnabled: boolean     = false;
 let buttonYPosition: number        = 50;
 let initialButtonYPosition: number = 50;
 let loginComponent;                              // Login component bound by <Login>
 let accessToken: string;

 // functions for the main button
 function enableSelectionMode() {
     if (isSelectionMode) {
         cancelSelectionMode();
     } else {
         isSelectionMode = true;
         clickTrackEnabled = true;
     }
 }
 function cancelSelectionMode() {
     isSelectionMode = false;
     clickTrackEnabled = false;
 }

 async function getAccessToken() {
     accessToken = await loginComponent.getAccessToken();
 }

 // import backgrou.ts here though we don't use it, because 'input background.ts' does not work in vite.config.js.
 export let neverLoad = false;

 if (neverLoad) import('../background');
</script>

<button id="start-button" on:click={enableSelectionMode}>
</button>

{#if isSelectionMode}
  <Button id="done-button" on:click={cancelSelectionMode} variant="raised" class="button-shaped-round">
    <Label>Done</Label>
  </Button>

  <Button id="login-button" on:click={getAccessToken} variant="outlined" class="button-shaped-round">
    <Label>Get Access Token</Label>
  </Button>

  <div>
    accessToken = {accessToken}
  </div>
  <!-- <Button id="login-button" on:click={loginComponent.openLoginModal} variant="outlined" class="button-shaped-round">
       <Label>Login</Label>
       </Button> -->
{/if}

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
