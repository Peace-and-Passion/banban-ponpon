/**

  Browser extension loader for Banban board

  @author Hirano Satoshi
  @copyright 2024 Peace and Passion
  @since 2024/10/02
 */

import App from './content.svelte';

//console.log('content.ts: start');

// load content.svelte
let targetElement = document.createElement('div');
targetElement.id = 'content-script-root';
document.body.appendChild(targetElement);
new App({ target: targetElement });

//console.log('content.ts: new App() end');
