<!--
     Modal dialog

     Usage: Give title and slot.

     <Modal isOpen={open} title="Sign in" onClose={() => {open = false}}>
       <div class="ponpon-center">
          <Button id="ponpon-signin-button" on:click={login}>
            Sign in
          </Button>
        </div>
     </Modal>

     @author Hirano Satoshi
     @copyright 2024 Peace and Passion
     @since 2024/10/09

-->
<script lang="ts">
 import Button from '../resources/button.svelte';
 export let id = '';
 export let isOpen = false; // モーダルのオープン状態を制御
 export let title = "Modal Title"; // モーダルのタイトル
 export let content = "Modal Content"; // モーダルの内容
 export let onClose = () => {}; // モーダルを閉じるための関数
</script>

<style>
 .modal-overlay {
   position: fixed;
   top: 0;
   left: 0;
   right: 0;
   bottom: 0;
   background-color: rgba(0, 0, 0, 0.5);
   display: flex;
   align-items: center;
   justify-content: center;
   z-index: 1000;
 }

 .modal {
   background-color: white;
   border-radius: 8px;
   padding: 20px 20px 14px 20px;
   box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.2);
   width: 300px;
   max-width: 90%;
   position: relative;
 }

 .modal-header {
   font-weight: bold;
   margin-bottom: 10px;
 }

 .modal-footer {
   margin-top: 20px;
   display: flex;
   justify-content: flex-end;
 }

 .close-button {
   color: lightblue;
   border: none;
   cursor: pointer;
 }
</style>

{#if isOpen}
  <div id={id} class="modal-overlay" on:click={onClose}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">{title}</div>
      <div class="modal-content">
        <slot></slot>
      </div>

      <div class="modal-footer">
        <Button class="close-button" on:click={onClose} variant="flat" label="Close"></Button>
      </div>
    </div>
  </div>
{/if}
