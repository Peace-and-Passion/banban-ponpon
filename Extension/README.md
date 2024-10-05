# REPLACEME

## Make your Git branch from master

- Run

  git checkout -b master origin/master
  git checkout -b your_name master
  git push origin your_name

## Building and running locally

- Make sure you have Node.js 19.7.0 or later installed
- cd Extension
- Run `npm install --force`
- Run `npm run dev`
- Open in Chrome

  file:///Users/your_name/dev/banban-ext/Extension/blank.html

- When you edit and save a file, Vite compiles it automatically. However, you need to reload the
  blank.html with CMD-R (Mac) to reflect the modification.


## Constants

- Import conf.ts

  import * as conf from '../conf';

- Use constants

  fetch(conf.apiURL + '/v1/my_api')

## To use components in Svelte Material UI

- Import components

  <script>
    import Card from '@smui/card';
  </script>

  <Card padded>A simple padded card.</Card>

### Firefox

- Open Firefox's [debugging page](about:debugging#/runtime/this-firefox) (`about:debugging#/runtime/this-firefox`)
- Click "Load Temporary Add-on..."
- Navigate to this project's root and select `manifest.json`

### background.ts

- content.svelt imports backgrou.ts though we don't use it, because 'input background.ts' does
  not work in vite.config.js. this is maybe @crxjs/vite-plugin depends on "vite": "^2.9.5" but
  our vite is 4.5 and we need 'npm install --force'.

 export let neverLoad = false;
 if (neverLoad) import('../background');
