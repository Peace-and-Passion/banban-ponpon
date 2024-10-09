<!--
     Button

     Usage: Give either label or slot.
     variant is either  flat, raised or outlined. The default is raised.

     Usage:
       import Button from '../resources/button.svelte';

       <Button id="ponpon-done-button" label="Done" on:click={cancelSelectionMode}>
       </Button>

       <Button on:click={login} valiant="flat">
       Sign in
       </Button>

     @author Hirano Satoshi
     @copyright 2024 Peace and Passion
     @since 2024/10/09

-->
<script lang="ts">
 export let label = ''; // button label but slot is also effective
 export let id = "";
 export let variant: 'flat'|'raised'|'outlined' = 'raised'; // button style
</script>

<style>
 .button {
   border-radius: 36px;
   padding: 10px 24px;
   font-size: 16px;
   font-weight: 500;
   text-transform: uppercase;
   cursor: pointer;
   overflow: hidden;
   transition: box-shadow 0.2s;
   box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.2);
 }

 .raised {
   background-color: red;
   color: white;
   border: none;
 }

 .raised:active {
   box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.3);
 }

 .flat {
   background-color: transparent;
   border: none;
   box-shadow: none;
 }

 .outlined {
   background-color: transparent;
   border: 2px solid #e0e0e0;
 }

 .outlined:active {
   box-shadow: none;
 }
</style>

<button class="button {variant}" id={id} on:click>
  {label}
  <slot></slot>
</button>
