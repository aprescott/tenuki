Tenuki is a browser-based go board in HTML, CSS and JavaScript.

<img src="https://raw.githubusercontent.com/aprescott/tenuki.js/master/examples/screenshots/board.png" width="151" height="150">

Features:

  * Ko rule.
  * Pass.
  * Undo.
  * End-game detection, dead stone marking, with territory scoring rules.

The go board provides a JavaScript interface to perform various functions, but the UI for individual controls is left to you.

# Examples

For live examples, see `examples/`, or view them on GitHub:

* [`example.html`](https://aprescott.github.io/tenuki.js/examples/example.html) — Just the board.
* [`example_with_simple_controls.html`](https://aprescott.github.io/tenuki.js/examples/example_with_simple_controls.html) — Board with an example of simple custom controls and updating game info.

# Simple usage

Create a new `tenuki.Board` instance with a DOM element, then call `setup()`, which displays the board itself and configures click handlers on each intersection:

```html
<link rel="stylesheet" href="build/tenuki.css">
<script src="build/tenuki.js"></script>

<div class="tenuki-board"></div>

<script>
  var boardElement = document.querySelector(".tenuki-board");
  var board = new tenuki.Board(boardElement);
  board.setup();
</script>
```

There are no other dependencies.

For a textured board, add the class `tenuki-board-textured`:

```html
<div class="tenuki-board tenuki-board-textured"></div>
```

<img src="https://raw.githubusercontent.com/aprescott/tenuki.js/master/examples/screenshots/board-textured.png" width="151" height="150">

# Other board sizes

You can pass a second argument to `new tenuki.Board` to specify the board size. If no size is given, the default of 19 is used. In theory any size should work, although star points have only been designed for 9x9, 13x13 and 19x19 boards.

```js
// use a 13x13 board
new tenuki.Board(boardElement, 13);
```

# Browser support

I've tested this on Chrome, Firefox, Safari and Opera.

# Known problems

Because the browser is rendered with pure CSS and no images, there are some pixel rounding issues when the browser's zoom level is not 100%. This can create positioning/alignment problems, for instance, at 110%, because widths and lines on the board are not consistent with each other.

# Board play functions

The following functions are available on a `tenuki.Board` object, and can be used to control the gameplay.

Note that all functions which take two integer coordinates (`y` and `x`) are measured from the top of the board and left of the board. So `y = 0` is the top-most row, and `x = 0` is the left-most row. On a 19x19 board, the top left star point (4-4) is thus at `y = 3` and `x = 3`.

* `pass()`: passes for the current player.
* `playAt(y, x)`: attempts to play a stone at `(y, x)` for the current player. If the move is illegal (because of ko, suicide, etc.), then nothing will happen.
* `isGameOver()`: returns `true` if the most recent 2 moves were passes, otherwise `false`.
* `toggleDeadAt(y, x)`: sets the group of stones at `(y, x)` to be dead as part of marking territory. Only useful if `isGameOver()` is `true`.
* `score()`: returns an object containing score information, e.g., `{ black: 150, white: 130 }`. Only useful if `isGameOver()` is `true`, since it requires dead stone marking to be accurate.
* `undo()`: undo the most recent move.

# Post-render callbacks

There is a configurable callback, `postRender`, which is fired each time the board is rendered, e.g., after every move.

This is useful if you want to update some other state:

```js
var board = new tenuki.Board(boardElement);
board.setup();

board.callbacks.postRender = function(board) {
  if (board.currentMove().pass) {
    console.log(board.currentMove().color + " passed");
  } else {
    console.log(board.currentMove().color + " played " + board.currentMove().y + "," + board.currentMove().x);
  }
};
```

# Running tests

Open [`test.html`](https://aprescott.github.io/tenuki.js/test.html) in your browser. If the tests all pass, you'll see "PASS" shown with black stones.

# Developing

You'll need [`browserify`](http://browserify.org/). You can install it with [`npm`](https://www.npmjs.com/) by running `npm install -g browserify`.

To make changes, update individual files in `lib/` and `css/`. Then, run `./build.sh` to generate `build/js/tenuki.js` and `build/css/tenuki.css`, suitable for use in a browser.

To test changes, use `test.html` and the files in `examples/` to check that things still work.
