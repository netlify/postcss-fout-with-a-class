# FOUT with a Class in PostCSS

At [Netlify](https://www.netlify.com) we wanted to speed up our initial page loads, and saw that font-loading
was the trickiest part of our critical path.

Font-loading in modern browsers is somewhat of a dark art and can be hard to setup and configure properly.

One of the best current approaches is [FOUT with a class](https://www.zachleat.com/web/comprehensive-webfonts/#fout-class). This technique takes advantage of
the fact that the browser won't start loading fonts before they are applied to some DOM element on the page.

We can combine this with service workers or session storage to make sure we lazy load fonts on the first view
to avoid blocking the initial critical rendering path, but load font instantly from cache so we avoid any
flash of un-styled text on subsequent page loads.

The flip side of that approach is that it requires a lot of discipline in the CSS to avoid accidentally apply
a font-family to an element without scoping it under a relevant class.

## PostCSS to the rescue!

This PostCSS plugin will handle all of that discipline for you, by detecting all fonts and moving them to scoped
selectors.

Example CSS

```css
@font-face {
    font-family: 'Mija';
    src: url('/fonts/MijaBold/Mija_Bold-webfont.woff2') format('woff2');
}
.fancy-headline h1 {
  font-size: 10rem;
  font-family: 'Mija';
}
```

Example PostCSS setup:

```js
import postcss from "postcss-gulp";
import foutWithAClass from "postcss-fout-with-a-class";

gulp.task('css', () => (
  gulp.src('./src/css/*.css')
    .pipe(postcss([foutWithAClass({families: ['Mija'], className: 'wf-loaded'})]))
    .pipe(gulp.dest('./dist/css'));
));
```

CSS output:

```css
@font-face {
    font-family: 'Mija';
    src: url('/fonts/MijaBold/Mija_Bold-webfont.woff2') format('woff2');
}
.fancy-headline h1 {
  font-size: 10rem;
}
.wf-loaded .fancy-headline h1 {
  font-family: 'Mija';
}
```

## Taking advantage of this

A simple way to take advantage of this is with a service worker. I recommend using the awesome [sw-toolbox](https://github.com/GoogleChrome/sw-toolbox) to simplify that. Here's an example
service worker that will load your fonts straight from the cache after initial load.

```js
import toolbox from 'sw-toolbox';

self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

toolbox.router.get('/fonts/*', toolbox.cacheFirst);
```

And a quick way to use this to either start loading fonts after the onload event, or loading straight
away once your service worker is active:

```html
<!doctype html>
<html>
<head>
  <title>Font Loading Demo</title>
  <link href="/css/main.css" rel="stylesheet"/>
</head>
<body>
  <script>
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller !== null && navigator.serviceWorker.controller.state === 'activated') {
    document.querySelector("html").classList.add('wf-loaded');
  } else {
    document.addEventListener('load', function() { document.querySelector("html").classList.add('wf-loaded'); }, false);
  }
  </script>

  <h1 class="fancy-headline">A Fancy Headline</h1>

</body>
</html>
```
