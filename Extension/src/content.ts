/**

  Banban Ponpon: Browser extension for Banban board

  @author Hirano Satoshi, Togashi Ayuto
  @copyright 2024 Peace and Passion
  @since 2024/10/02
 */

import Main from './content/main.svelte';

// load content.svelte
let targetElement = document.createElement('div');
targetElement.id = 'content-script-root';
document.body.appendChild(targetElement);
new Main({ target: targetElement });
