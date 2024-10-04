<!--

     Browser extension template for Banban board

     @author Hirano Satoshi
     @copyright 2024 Peace and Passion
     @since 2024/10/02
-->

<script lang="ts">
 import Button, { Label } from '@smui/button';

 // init Svelte Material UI with 'svelte' theme
 import 'svelte-material-ui/themes/svelte.css'

 // load our global CSS
 import './style.css';

 console.log('content.svelte started');

 let multiSelectButton;
 let isSelectionMode: boolean       = false;
 let clickTrackEnabled: boolean     = false;
 let buttonYPosition: number        = 50;
 let initialButtonYPosition: number = 50;

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

</script>

<button id="start-button" on:click={enableSelectionMode}>
</button>

{#if isSelectionMode}
  <Button id="done-button" on:click={cancelSelectionMode} variant="raised">
    <Label>Done</Label>
  </Button>
{/if}

<style>
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
   border-radius: 50px;
 }
</style>
