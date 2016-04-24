[![Build Status](https://travis-ci.org/aprescott/tenuki.js.svg?branch=master)](https://travis-ci.org/aprescott/tenuki.js)

Tenuki is a JavaScript implementation of the game of go/baduk/weiqi with full support for HTML rendering out of the box.

_The API is still subject to change at any point. Treat it as beta software!_

There are two main pieces:

1. **A JavaScript engine** representing the board, game, and rules.
2. **An interactive HTML go board** to play the game.

The JavaScript engine is not dependent on the renderer and works stand-alone. You can use it by itself as part of a larger JavaScript application.

The HTML go board is intended to be a robust, functional component that can be embedded in a web page. By using the JavaScript API you could then build your own custom controls for undo/pass/etc.

<img src="https://raw.githubusercontent.com/aprescott/tenuki.js/master/examples/screenshots/board.png" width="151" height="150">

Features:

  * Ko rule.
  * Pass.
  * Undo.
  * Handicap stones.
  * Optional coordinate markers for points A19 through T1.
  * Built-in mobile support for touch devices and small screens, even with a 19x19 board.
  * End-game functionality: dead stone marking, area/territory scoring.

# Examples

For live examples, see `examples/`, or view them on GitHub:

* [`example_with_simple_controls.html`](https://aprescott.github.io/tenuki.js/examples/example_with_simple_controls.html) — Board with an example of simple custom controls and updating game info.
* [`example_with_simple_controls_and_gutter.html`](https://aprescott.github.io/tenuki.js/examples/example_with_simple_controls_and_gutter.html) — Same as above, but with the A19 to T1 coordinate markers.
* [`example_multiboard.html`](https://aprescott.github.io/tenuki.js/examples/example_multiboard.html) — Multiple 9x9 boards on a single page.
* [`example.html`](https://aprescott.github.io/tenuki.js/examples/example.html) — Just the board.

These examples are also set up to **work on mobile/touch displays**.

Here are some screenshots and GIFs:

* [Top-right corner of the board, with some stones](https://i.imgur.com/w6D33pf.png)
* [Same as above, but with textured stones](https://i.imgur.com/zuuTWu8.png)
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

<img src="https://raw.githubusercontent.com/aprescott/tenuki.js/master/examples/screenshots/board-textured.png" width="151" height="150">

# Coordinate markers

For coordinate markers, indicating positions A19 through T1, add `data-include-coordinates=true` to the HTML element for the board:

```html
<div class="tenuki-board" data-include-coordinates="true"></div>
```

# Other board sizes

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

# Browser support

I've tested this on Chrome, Firefox, Safari and Opera.

# Known problems

On a desktop, because the browser is rendered with pure CSS and no images, there are some pixel rounding issues when the browser's zoom level is not 100% after zooming with `Ctrl-+` (or `Cmd-+`). This can create positioning/alignment problems, for instance, at 110%, because widths and lines on the board are not consistent with each other.

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
* `territoryScore()` and `areaScore()`: return an object containing score information, e.g., `{ black: 150, white: 130 }`. Only useful if `isOver()` is `true`, since proper scoring requires dead stone marking at the end of the game.
* `undo()`: undo the most recent move.

# Post-render callbacks

There is a configurable callback, `postRender`, which is fired each time the board is rendered, e.g., after every move.

This is useful if you want to update some other state:

```js
var game = new tenuki.Game(boardElement);
game.setup();

game.callbacks.postRender = function(game) {
  if (game.boardState().pass) {
    console.log(game.boardState().color + " passed");
  }

  if (game.boardState().playedPoint) {
    console.log(game.boardState().color + " played " + game.boardState().playedPoint.y + "," + game.boardState().playedPoint.x);
  }
};
```

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
