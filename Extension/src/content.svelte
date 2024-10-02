<!--

  Browser extension template for Banban board

  @author Hirano Satoshi
  @copyright 2024 Peace and Passion
  @since 2024/10/02
-->

<script lang="ts">
console.log('hello from the content!');
import './style.css';

let multiSelectButton;
let isSelectionMode= false;
let clickTrackEnabled = false;
let buttonYPosition = 50;
let initialButtonYPosition = 50;

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
  <button id="done-button" on:click={cancelSelectionMode}>
  Done
  </button>
{/if}

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
    z-index: 1000;
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
    z-index: 1000;
    font-size: 1.2rem;
}
</style>
