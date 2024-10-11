/**

  Banban Ponpon: Browser extension for Banban board

  @author Hirano Satoshi, Togashi Ayuto
  @copyright 2024 Peace and Passion
  @since 2024/10/02
 */

import Main from './content/main.svelte';

// load icons
// <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=close" />
const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=close";
document.head.appendChild(link);

// load content.svelte
let targetElement = document.createElement('div');
targetElement.id = 'content-script-root';
document.body.appendChild(targetElement);
new Main({ target: targetElement });
