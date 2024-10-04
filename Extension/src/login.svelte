<!--

     Browser extension template for Banban board

     @author Hirano Satoshi
     @copyright 2024 Peace and Passion
     @since 2024/10/02
-->

<script lang="ts">
 export const test = 'abc';
 import Button, { Label } from '@smui/button';

 import { Passkey } from './passkey';
 import Modal from './resources/Modal.svelte';

 let showLoginModal     = false;
 const passkey = new Passkey();

 export function openLoginModal() {
     showLoginModal = true;
 }

 async function login() {
     const accessToken = await passkey.authenticate({land_id_or_userID: 'hhh//h-com'});
     showLoginModal = false;
 }

</script>

<Modal bind:showModal={showLoginModal} id="signin-dialog">
  <h2 slot="header" style="width: 300px;">
    Singin
  </h2>

  <Button id="signin-button" on:click={login} variant="raised">
    Signin
  </Button>
</Modal>

<Modal id="signed-dialog">
  <h2 slot="header">
    You are signed-in!
  </h2>

  {passkey.accessToken}

</Modal>

<style>
 :global(#signin-dialog),:global(#signed-dialog) {
   width: 300px;
 }
 :global(#signin-button) {
   background: #6AD8F0;
   color: white;
   font-size: 1rem;
   padding: 1em 28px;
   border-radius: 50px;
 }
</style>
