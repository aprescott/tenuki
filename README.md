Tenuki is a browser-based go board implementation in HTML, CSS and JavaScript.

# Examples

For live examples, see `examples/`, or view them on GitHub:

* [`example.html`](https://aprescott.github.io/tenuki.js/examples/example.html) — Just the board.
* [`example_with_controls.html`](https://aprescott.github.io/tenuki.js/examples/example_with_simple_controls.html) — Board with simple controls.

# Simple usage

Create a new `tenuki.Board` instance with a DOM element, then call `setup()`:

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

# Browser support

I've tested this on Chrome, Firefox, Safari and Opera.

# Post-render callbacks

There is a configurable callback, `postRender`, which is fired whenever the board is rendered (or re-rendered), e.g., after every move.

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

Open [`test.html`](https://aprescott.github.io/tenuki.js/test.html) in your browser.
