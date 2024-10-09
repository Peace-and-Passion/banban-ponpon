# REPLACEME

## Make your Git branch from master

  git checkout -b master origin/master
  git checkout -b your_name master
  git push origin your_name

## Building and running locally

   cd Extension
   npm install
   npm run dev

## Locally running for production but not production build

   npm run prod

## Load Ponpon as Chrome extension

   open chrome://extensions
   Press 「パッケージ化されていない拡張機能を読み込む」, and specify Extension/dist
   Press "Service Worker" to open devtools for the background script.


## Open blank.html in Chrome

  file:///Users/your_name/dev/banban-ponpon/Extension/blank.html

- When you edit and save a file, Vite compiles it automatically. However, you need to reload the
  blank.html often with CMD-R (Mac) to reflect the modification.

- Also you may need to abort and rerun "npm run dev" when you have syntax error in your code.

- Also you may need to restart Chrome when something wrong.


## Types

- Define types used for communication between the content script and the background script in src/shim.d.ts.

  See https://serversideup.net/open-source/webext-bridge/docs/guide/type-safe-protocols

## Constants

- Import conf.ts

  import * as conf from '../conf';

- Use constants

  fetch(conf.apiURL + '/v1/my_api')

## Dummy types for page_parser

- Replace this with page_parser/types.ts when it is available.

  types_dummy.ts

## To use UI components in src/resources

- See each file in src/resources for usage.

  import Button from '../resources/button.svelte';

  <Button id="ponpon-done-button" label="Done" on:click={cancelSelectionMode}>
  </Button>

  <Button on:click={login} valiant="flat">
  Sign in
  </Button>

## background.ts

- content.svelt imports backgrou.ts though we don't use it, because 'input background.ts' does
  not work in vite.config.js. this is maybe @crxjs/vite-plugin depends on "vite": "^2.9.5" but
  our vite is 4.5 and we need 'npm install --force'.

 export let neverLoad = false;
 if (neverLoad) import('../background');

## Firefox

- Open Firefox's [debugging page](about:debugging#/runtime/this-firefox) (`about:debugging#/runtime/this-firefox`)
- Click "Load Temporary Add-on..."
- Navigate to this project's root and select `manifest.json`

## Caution

- Since CSS conflists with page scripts, we cannot use component libraries such as  [Svelte Material UI](https://sveltematerialui.com/).
