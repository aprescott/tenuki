Tenuki is a browser-based go board implementation in HTML, CSS and JavaScript.

# Examples

For live examples, see `examples/`.

# Simple usage

Create a new `tenuki.Board` instance with a DOM element, then call `setup()`:

```html
<div class="board"></div>

<script>
window.addEventListener("load", function() {
  boardElement = document.querySelector(".board");
  window.board = new tenuki.Board(boardElement);
  window.board.setup();
}, false)
</script>
```

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

Open `test.html` in your browser.
