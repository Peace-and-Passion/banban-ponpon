<!--

     Browser extension template for Banban board

     @author Hirano Satoshi
     @copyright 2024 Peace and Passion
     @since 2024/10/02
-->

<script lang="ts">
 console.log('content.svelte started');
 import './style.css';
 import { Passkey } from './passkey';
 import Modal from './resources/Modal.svelte';

 let multiSelectButton;
 let isSelectionMode: boolean       = false;
 let clickTrackEnabled: boolean     = false;
 let buttonYPosition: number        = 50;
 let initialButtonYPosition: number = 50;

 let showLoginModal;
 const passkey = new Passkey();

 function enableSelectionMode() {
     if (isSelectionMode) {
         cancelSelectionMode();
     } else {
         isSelectionMode = true;
         clickTrackEnabled = true;
         showLoginModal = true;
     }
 }
 function cancelSelectionMode() {
     isSelectionMode = false;
     clickTrackEnabled = false;
 }

</script>

<button id="start-button" on:click={enableSelectionMode}>
</button>

{#if isSelectionMode}
  <button id="done-button" on:click={cancelSelectionMode}>
    Done
  </button>
{/if}

<Modal bind:showModal={showLoginModal}>
  <h2 slot="header">
    Singin
  </h2>

  <button on:click={() => passkey.authenticate({land_id_or_userID: 'hhh//h-com'})}>
    Login
  </button>
</Modal>

<style>
 #start-button {
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

 #done-button {
   position: fixed;
   top: 78px;
   left: 18px;
   padding: 4px 8px;
   border-radius: 4px;
   overflow: hidden;
   border: none;
   background-color: #f4f4fe;
   z-index: 10000;
   font-size: 1.2rem;
   cursor: pointer;
 }
</style>
