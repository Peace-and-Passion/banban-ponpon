/**

  Banban Ponpon: Browser extension for Banban board

  @author Hirano Satoshi, Togashi Ayuto
  @copyright 2024 Peace and Passion
  @since 2024/10/02
 */

import App from './content/content.svelte';

//console.log('content.ts: start');

// load content.svelte
let targetElement = document.createElement('div');
targetElement.id = 'content-script-root';
document.body.appendChild(targetElement);
new App({ target: targetElement });

//console.log('content.ts: new App() end');
