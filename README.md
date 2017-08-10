[![Build Status](https://travis-ci.org/aprescott/tenuki.svg?branch=master)](https://travis-ci.org/aprescott/tenuki)

Tenuki is a web-based board and JavaScript library for the game of go/baduk/weiqi.

_The API is still subject to change at any point. Treat it as beta software!_

There are two main pieces:

1. **A JavaScript engine** representing the board, game, and rules.
2. **A go board interface**.

The JavaScript engine is not dependent on the renderer and works stand-alone. You can use it by itself as part of a larger JavaScript application.

The go board interface is intended to be a robust, functional component that can be embedded in a web page. By using the JavaScript API you could then build your own custom controls for undo/pass/etc.

The game engine supports playing an entire game and has various features and configuration settings:

  * Both Simple ko and superko rules.
  * Handicap stones, with or without free placement.
  * End-game functionality: dead stone marking and scoring.
  * Different scoring rules: territory, area, equivalence (with pass stones).
  * Komi.
  * Seki detection for territory scoring rules.

The board UI also has its own features:

  * A responsive UI for comfortably playing on touch devices and small screens.
  * Automatic board resizing to fit the layout.
  * Ko point markers.
  * Optional coordinate markers for points A19 through T1.
  * Optional fuzzy stone placement with collision movement animations.

# Live examples

For live examples, see `examples/`, or view them on GitHub:

* [`example_with_simple_controls.html`](https://aprescott.github.io/tenuki/examples/example_with_simple_controls.html) — Board with an example of simple custom controls and updating game info.
* [`example_fuzzy_placement.html`](https://aprescott.github.io/tenuki/examples/example_fuzzy_placement.html) — Fuzzy stone placement.
* [`example_with_simple_controls_and_gutter.html`](https://aprescott.github.io/tenuki/examples/example_with_simple_controls_and_gutter.html) — A19 to T1 coordinates in the margins.
* [`example_multiboard.html`](https://aprescott.github.io/tenuki/examples/example_multiboard.html) — Multiple independent 9x9 boards on a single page.
* [`example.html`](https://aprescott.github.io/tenuki/examples/example.html) — Just the board.

These examples are also set up to work on mobile/touch displays, because the board is set to fit within the browser window.

# Installation

If you use npm, then `npm install tenuki`. Otherwise, you can download the files you need from [the latest release](https://github.com/aprescott/tenuki/releases).

It's also possible to clone this repo and run `make` against the latest commit, which will generate files in `build/`.

# Simple usage

Create a new `tenuki.Game` instance, which displays the board itself and configures click handlers on each intersection:

```html
<link rel="stylesheet" href="build/tenuki.css">
<script src="build/tenuki.js"></script>

<div class="tenuki-board"></div>

<script>
  var boardElement = document.querySelector(".tenuki-board");
  var game = new tenuki.Game({ element: boardElement });
</script>
```

There are no other dependencies.

# Flat stone styling

For a completely flat board with no stone shadows or gradients, add the class `tenuki-board-flat`:

```html
<div class="tenuki-board tenuki-board-flat"></div>
```

# Fuzzy stone placement

For fuzzy stone placement, pass `fuzzyStonePlacement: true` as a game option:

```js
new tenuki.Game({
  fuzzyStonePlacement: true
});
```

When enabled, played stones will be randomly placed slightly off-center. If stones overlap after placement, existing stones are bumped out of the way.

# Auto-scaling and responsiveness

By default, the `.tenuki-board` element will take up only the necessary amount of space in the document.

If your CSS causes the `.tenuki-board` HTML element to be set to a smaller size than it would ordinarily be, then the board will automatically shrink to fit within that size.

Similarly, if your CSS causes `.tenuki-board` to be larger than the board ordinarily would be, then the board will automatically expand to fit the container.

For example, let's say you'd like the board to be a width of 200px:

```html
<style>
  .my-class {
    width: 200px;
  }
</style>

<div class="my-class tenuki-board"></div>
```

A full 19x19 board is usually larger than 200px. But, here, because of the `.my-class` styling, the entire board will automatically scale down to fit the 200px constraint.

Similarly, suppose the board is set to have a dynamic size based on the viewport:

```html
<style>
  .my-class {
    width: 50%; /* say this is 50% of the body */
  }
</style>

<div class="my-class tenuki-board"></div>
```

Now the board will be sized dynamically. If the viewport changes, the board will resize.

# Coordinate markers

For coordinate markers, indicating positions A19 through T1, add `data-include-coordinates=true` to the HTML element for the board:

```html
<div class="tenuki-board" data-include-coordinates="true"></div>
```

# SVG renderer

The default renderer uses SVG to display the board. If this is a problem, you can pass `renderer: "dom"` as a game setup option to switch to using a renderer based solely on DOM elements. This is _not recommended_. The all-DOM approach has worse performance and has alignment issues at browser zoom levels other than 100%, 200%, etc.

# Board sizes other than 19x19

You can pass a `boardSize` option to specify the board size. If no size is given, the default of 19 is used. All sizes between 1x1 and 19x19 should work. Sizes above 19x19 will error and won't render.

```js
var game = new tenuki.Game({
  element: boardElement,
  // use a 13x13 board
  boardSize: 13
});
```

# Handicap stones

Handicap stones (2 through 9) are supported on sizes 9x9, 13x13 and 19x19.

```js
new tenuki.Game({
  handicapStones: 5
});
```

By default, handicap placement is fixed at the traditional star points. To allow free handicap placement, set `freeHandicapPlacement: true`:

```js
new tenuki.Game({
  handicapStones: 5,
  freeHandicapPlacement: true
});
```

# Configuring scoring

The default scoring method is territory scoring. The scoring rule is configured as a setup option:

```js
new tenuki.Game({
  scoring: "area" // default is "territory"
});
```

Valid scoring types are:

  * `"area"`
  * `"territory"`
  * `"equivalence"`

## Area scoring

The score for each player under area scoring is the sum of two values:

* The number of stones on the board.
* The number of points of territory.

Eyes in seki count as territory under area scoring.

## Territory scoring

The score for each player under territory scoring is the number of points of territory, plus opponent stones you captured.

Eyes in seki _do not_ count as points of territory.

When territory scoring is in use, a simple detection algorithm attempts to correctly ignore each of the following as not-territory:

1. Neutral points, consisting of intersections surrounded by neither player.
2. Intersections which would be the point of capture for a group in atari, after filling in neutral points.
3. Eyes in seki.

Counting eyes in seki relies on a way of determining whether a group of stones is in seki. Tenuki detects seki by counting eyes, after filling in other neutral points.

The more neutral points exist on the board, the more likely it is that seki detection will fail in some way.

_It is strongly recommended that you fill in all neutral points before passing at the end of a game._

## Equivalence scoring

An explanation of equivalence scoring can be found at the [Sensei's Library Wiki](http://senseis.xmp.net/?EquivalenceScoring), and a longer explanation of the equivalence can be found in a [commentary appendix to the AGA Rules](https://www.cs.cmu.edu/~wjh/go/rules/AGA.commentary.html).

In short, equivalence scoring implements pass stones, plus the requirement that white make one final pass prior to scoring, which makes the score from counting by area equivalent to the score from counting by territory.

Note that using equivalence scoring does _not_ change how the game ends. The game will end with 2 consecutive passes, even if black makes the 2nd pass. The final white pass stone handed to black is implemented in Tenuki by the `game.score()` function, not a move by a player.

# Komi

The default komi value is 0. To alter the value of white's score, specify `komi` as an option:

```js
new tenuki.Game({
  komi: 6.5
});
```

Komi is not automatically chosen based on the scoring type.

# Ko and superko

The default ko rule is the simple variant: immediately recreating the previous board position is not allowed. Superko is also supported with the `koRule` configuration option:

```js
new tenuki.Game({
  koRule: "positional-superko" // default is "simple"
})
```

Valid ko rule values are:

* `"simple"` — Immediately recreating the previous board position is illegal.
* `"positional-superko"` — Recreating _any_ previous position is illegal.
* `"situational-superko"` — Is it illegal for a player to recreate any previous position which that same player was responsible for creating. This is like positional superko, but takes into account the creator of the position.
* `"natural-situational-superko"` — The same as situational superko, except a player may place a stone to recreate a previous position, provided that previous position was created by a pass. This is like natural situational superko, but distinguishes between passes and board plays. More details can be found at [Sensei's Library](http://senseis.xmp.net/?NaturalSituationalSuperko).

# Usage outside of a browser

The full browser environment is not required in order to use the representation of the game in JavaScript. For example, if you have a node app, you can simply create a new game without passing an element:

```js
var Game = require("tenuki").Game;
game = new Game();
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
* `markDeadAt(y, x)`, `unmarkDeadAt(y, x)` and `toggleDeadAt(y, x)`: set the group of stones at `(y, x)` to dead or undead as part of marking territory. Only useful if the game is over.
* `score()` returns scoring information, e.g., `{ black: 150, white: 130 }`. Only useful if `isOver()` is `true`, since proper scoring requires dead stone marking at the end of the game. Scoring is dependent on the scoring rules in use.
* `undo()`: undo the most recent move.

When rendering to a HTML board element, changing the game state will re-render the board. `pass`, `playAt`, `markDeadAt`, `unmarkDeadAt` and `toggleDeadAt` all support `{ render: false }` as an option, which will skip the board rendering step. To manually render the board with `render: false`, call `game.render()` explicitly.

# Post-render callbacks

There is a configurable callback, `postRender`, which is fired each time the board is rendered, e.g., after every move.

This is useful if you want to update some other state:

```js
var game = new tenuki.Game(boardElement);

game.callbacks.postRender = function(game) {
  if (game.currentState().pass) {
    console.log(game.currentState().color + " passed");
  }

  if (game.currentState().playedPoint) {
    console.log(game.currentState().color + " played " + game.currentState().playedPoint.y + "," + game.currentState().playedPoint.x);
  }
};
```

# Running tests

Run tests with `npm test`.

# Developing

First, make sure [`npm`](https://www.npmjs.com/) is installed, then run:

```shell
npm install && make
```

To make changes, update individual files in `src/` and `scss/`. Then, run `make` to generate files in `build/`.

To test changes, use `npm test` and load `test.html` in a browser. You can also smoke test the examples in `examples/`.
