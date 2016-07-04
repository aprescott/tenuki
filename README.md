[![Build Status](https://travis-ci.org/aprescott/tenuki.js.svg?branch=master)](https://travis-ci.org/aprescott/tenuki.js)

Tenuki is a web-based board and JavaScript library for the game of go/baduk/weiqi.

_The API is still subject to change at any point. Treat it as beta software!_

There are two main pieces:

1. **A JavaScript engine** representing the board, game, and rules.
2. **A go board interface**.

The JavaScript engine is not dependent on the renderer and works stand-alone. You can use it by itself as part of a larger JavaScript application.

The go board interface is intended to be a robust, functional component that can be embedded in a web page. By using the JavaScript API you could then build your own custom controls for undo/pass/etc.

<img src="https://raw.githubusercontent.com/aprescott/tenuki.js/master/examples/screenshots/board.png" width="124" height="124">

Features:

  * Simple ko and superko.
  * Pass.
  * Undo.
  * Handicap stones, with or without free placement.
  * End-game functionality: dead stone marking and scoring.
  * Different scoring rules: territory, area, equivalence (with pass stones).
  * Komi.
  * Seki detection for the territory rules.
  * A client interface for playing against a server.
  * For the visual interface:
    - Built-in mobile support for touch devices and small screens, even with a 19x19 board.
    - Automatic shrinking to fit given board (pixel) dimensions.
    - Optional coordinate markers for points A19 through T1.
    - Optional fuzzy stone placement with collision movement animations.

# Examples

For live examples, see `examples/`, or view them on GitHub:

* [`example_with_simple_controls.html`](https://aprescott.github.io/tenuki.js/examples/example_with_simple_controls.html) — Board with an example of simple custom controls and updating game info.
* [`example_fuzzy_placement.html`](https://aprescott.github.io/tenuki.js/examples/example_fuzzy_placement.html) — Fuzzy stone placement.
* [`example_with_simple_controls_and_gutter.html`](https://aprescott.github.io/tenuki.js/examples/example_with_simple_controls_and_gutter.html) — A19 to T1 coordinates in the margins.
* [`example_multiboard.html`](https://aprescott.github.io/tenuki.js/examples/example_multiboard.html) — Multiple independent 9x9 boards on a single page.
* [`example.html`](https://aprescott.github.io/tenuki.js/examples/example.html) — Just the board.

These examples are also set up to **work on mobile/touch displays**.

Here are some screenshots and GIFs:

* [Top-right corner of the board, with some stones](https://i.imgur.com/w6D33pf.png)
* [GIF: Desktop gameplay on a full-sized board](https://i.imgur.com/7cQkoaf.gif)
* [GIF: Desktop gameplay with a smaller board](https://i.imgur.com/N0YgjJD.gif)
* [GIF: Touch-screen gameplay on a mobile device (zooming)](https://i.imgur.com/7UDNTJM.gif)
* [GIF: Touch-screen gameplay (dragging)](https://i.imgur.com/YaIZIkV.gif)
* [GIF: Pinch-zooming yourself on a mobile device](https://i.imgur.com/wvsifZg.gif)

# Installation

* With bower: `bower install tenuki`
* With npm: `npm install tenuki`
* Download the `zip` or `tar.gz` file for a specific version from [the releases page](https://github.com/aprescott/tenuki.js/releases), then use `build/` however you want.

You can also clone this repo and get the `build/` files that way.

# Simple usage

Create a new `tenuki.Game` instance with a DOM element, then call `setup()`, which displays the board itself and configures click handlers on each intersection:

```html
<link rel="stylesheet" href="build/tenuki.css">
<script src="build/tenuki.js"></script>

<div class="tenuki-board"></div>

<script>
  var boardElement = document.querySelector(".tenuki-board");
  var game = new tenuki.Game(boardElement);
  game.setup();
</script>
```

There are no other dependencies.

# Textured styling

For a textured board, add the class `tenuki-board-textured`:

```html
<div class="tenuki-board tenuki-board-textured"></div>
```

<img src="https://raw.githubusercontent.com/aprescott/tenuki.js/master/examples/screenshots/board-textured.png" width="124" height="124">

# Fuzzy stone placement

For fuzzy stone placement, pass `fuzzyStonePlacement: true` as a game option:

```js
game.setup({
  fuzzyStonePlacement: true
});
```

When enabled, stones are set to textured styling, and played stones will be randomly placed slightly off-center. If stones overlap after placement, existing stones are bumped out of the way.

# Auto-shrinking to fit dimensions

If the container element (e.g., `<div class="tenuki-board">`) is given smaller dimensions than the board would occupy, the board is rendered at a smaller scale.

```html
<style>
  .my-class {
    max-width: 200px;
  }
</style>

<div class="my-class tenuki-board"></div>
```

A full 19x19 board is usually larger than 200px, but here, because of the `.my-class` styling, the entire board will automatically scale down to fit.

# Coordinate markers

For coordinate markers, indicating positions A19 through T1, add `data-include-coordinates=true` to the HTML element for the board:

```html
<div class="tenuki-board" data-include-coordinates="true"></div>
```

# SVG renderer

The default renderer uses SVG to display the board. If this is a problem, you can pass `renderer: "dom"` as a game setup option to switch to using a renderer based solely on DOM elements. This is _not recommended_. The all-DOM approach has worse performance and has alignment issues at browser zoom levels other than 100%, 200%, etc.

# Board sizes other than 19x19

You can pass a second argument to `new tenuki.Game` to specify the board size. If no size is given, the default of 19 is used. All sizes between 1x1 and 19x19 should work. Sizes above 19x19 will error and won't render.

```js
var game = new tenuki.Game(boardElement);
// use a 13x13 board
game.setup({
  boardSize: 13
});
```

# Handicap stones

Handicap stones (2 through 9) are supported on sizes 9x9, 13x13 and 19x19.

```js
game.setup({
  handicapStones: 5
});
```

By default, handicap placement is fixed at the traditional star points. To allow free handicap placement, set `freeHandicapPlacement: true`:

```js
game.setup({
  handicapStones: 5,
  freeHandicapPlacement: true
});
```

# Configuring scoring and komi

The default scoring is territory scoring. The scoring can be given as part of the `setup()` options:

```js
game.setup({
  scoring: "area" // default is "territory"
});
```

Valid scoring types are:

  * `"area"` — Area scoring.
  * `"territory"` — Territory scoring.

The default komi value is 0. To alter the value of white's score, pass `komi`:

```js
game.setup({
  komi: 6.5
});
```

Komi is not automatically chosen based on the scoring type.

# Ko and superko

The default ko rule is the simple variant: immediately recreating the previous board position is not allowed. Superko is also supported with the `koRule` configuration option:

```js
game.setup({
  koRule: "superko" // default is "simple"
})
```

Valid ko rule values are:

  * `"simple"` — Immediately recreating the previous board position is illegal.
  * `"superko"` — Recreating any previous position is illegal. (Also known as "positional superko".)

# Usage outside of a browser

The full browser environment is not required in order to use the representation of the game in JavaScript. For example, if you have a node app, you can simply create a new game without passing an element:

```js
var Game = require("tenuki").Game;
game = new Game();
game.setup();
```

From there, the JavaScript interface is the same as in a browser console:

```js
game.intersectionAt(0, 0).value;
// 'empty'
game.currentPlayer();
// 'black'
game.isOver();
// false
game.playAt(0, 0);
// true
game.intersectionAt(0, 0).value;
// 'black'
```

# Game play functions

There are functions are available on a `Game` object that can be used to control the gameplay.

Note that all functions which take two integer coordinates (`y` and `x`) are measured from the top of the board and left of the board. So `y = 0` is the top-most row, and `x = 0` is the left-most row. On a 19x19 board, the top left star point (4-4) is thus at `y = 3` and `x = 3`.

* `pass()`: passes for the current player.
* `playAt(y, x)`: attempts to play a stone at `(y, x)` for the current player. If the move is illegal (because of ko, suicide, etc.), then nothing will happen. Returns `true` if the move is successful, otherwise `false`.
* `isOver()`: returns `true` if the most recent 2 moves were passes, indicating the game is over, otherwise `false`.
* `toggleDeadAt(y, x)`: sets the group of stones at `(y, x)` to be dead as part of marking territory. Only useful if `isOver()` is `true`.
* `score()` returns scoring information, e.g., `{ black: 150, white: 130 }`. Only useful if `isOver()` is `true`, since proper scoring requires dead stone marking at the end of the game. Scoring is dependent on the scoring rules in use.
* `undo()`: undo the most recent move.

# Post-render callbacks

There is a configurable callback, `postRender`, which is fired each time the board is rendered, e.g., after every move.

This is useful if you want to update some other state:

```js
var game = new tenuki.Game(boardElement);
game.setup();

game.callbacks.postRender = function(game) {
  if (game.currentState().pass) {
    console.log(game.currentState().color + " passed");
  }

  if (game.currentState().playedPoint) {
    console.log(game.currentState().color + " played " + game.currentState().playedPoint.y + "," + game.currentState().playedPoint.x);
  }
};
```

# Using `Client` to play against a server

The `Game` interface is only useful for local play. For play against a remote server, there is the `Client` interface.

For an example of how to use `Client`, the `test-server/` directory contains a demo client and server setup.

  * `cd test-server/` and run `node server.js`.
  * Open `test-server/client.html` in a browser.

The game is set to run on a fixed 9x9 board.

# Running tests

For end-to-end tests on a real board, open [`test.html`](https://aprescott.github.io/tenuki.js/test.html) in your browser. If the tests all pass, you'll see "PASS" shown with black stones.

For other tests, use `npm test`.

# Developing

First, make sure [`npm`](https://www.npmjs.com/) is installed, then run:

```shell
npm install
```

To make changes, update individual files in `src/` and `css/`. Then, run `./build.sh` to generate files in `build/`.

To test changes, use `test.html` and the files in `examples/` to check that things still work.
