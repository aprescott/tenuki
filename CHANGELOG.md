# Next version

* ...

# v0.3.1

* Change `"superko"` as a ko setting to `"positional-superko"` to be explicit.
* Support situational and natural situational superko variants. (#31)
* Two consecutive passes will now always end the game under equivalence scoring. Previously, the requirement that white "pass" last was implemented as a game-ending requirement. Now, the game will always end after 2 passes, with the score handling the extra white pass stone to represent a "pass" move. (#30)
* `playAt` now returns `false` for a move which is illegal on the basis of ko. Previously it incorrectly returned `null`.
* `playAt` and `intersectionAt` will now throw an error if given intersection values are not on the board.
* `Game` creation will throw an error for option keys which are valid, but where the value is given as null or undefined. This is to prevent defaults from unknowingly being used.
* Calling `setup()` on a `Game` is removed. Setup should now happen in the constructor, e.g., `new Game({ element: el, boardSize: 13 })`. Similarly for `Client`.
* Dead stone marking is now faster in cases where there are many groups.
* `playAt`, `pass` and `toggleDeadAt` now accept `{ render: false }` as an argument, which skips board rendering. This allows, e.g., playing N moves without rendering the board, then manually rendering once each has been played.
* Some general improvements to board rendering.
* Dead stone marking now happens in bulk based on regions.
* Board and stone colors have been lightened.
* `.tenuki-board-textured` is now the default. To use flat stone styling with no gradients or shadows, set `.tenuki-board-flat` as the class name.
* Allow the SVG renderer to function properly when the URL has a URI fragment / hash. (#38, maackle)

# v0.2.2

* SVG renderer: Don't colour the entire board element, just the area around the playable intersections.
* Make sure only the visible board is treated as draggable.
* Automatically scale up the board to the container's size. Previously we were only scaling down. Now it's in both directions.
* Stop showing the text selection cursor when dragging.
* Fix SVG stone rendering issues in Firefox when using textured stones. (#27)
* Node 6.0 or later is now required.

# v0.2.1

* Resizing the window (including rotating) will re-calculate board sizing.
* When zoomed in with Tenuki's own zoom, pinch-zooming on the board has no effect.
* Simplify textured stone styling.
* Add a new default renderer which uses SVG.
* Support for komi as a `game.setup()` option.
* Support for free handicap placement.
* Correctly treat handicap stones as occupied (and thus illegal for white) at the start of a game. This fixes a bug where white could play over an occupied black handicap stone as the first move, and where the stone would visually be removed on hover in the UI.

# v0.2.0

* `data-include-gutter=true` is replaced with `data-include-coordinates=true`.
* Board sizes are no longer specified in the constructor. Instead of `new Game(el, 9)`, it's now `game.setup({ boardSize: 9 })`.
* Correctly handle capturing stones whose last liberty was shared. (#8)
* Support for handicap stones on 9x9, 13x13 and 19x19. (#10)
* `currentPlayer` is now a function, not a property.
* `territoryScore()` and `areaScore()` are replaced with `score()`. A new `setup()` option allows defining the scoring in use for a game.
* Superko support with a configurable `koRule` option.
* Support for equivalence scoring (with pass stones) as a scoring option.
* `game.boardState()` is now `game.currentState()`.
* A new `Client` interface for playing against a remote server.
* Prevent Safari/WebKit from showing a grey box on an empty intersection on tap.
* Empty intersections are no longer allowed to be treated as dead stones.
* Stone styling is changed slightly. The last-played-point marker is now a disc not a circle. Textured stone styling is less shiny/reflective in appearance.
* Fuzzy stone placement is added as a configurable option. When enabled, stones will be randomly placed off center by 1px or 2px. If stones collide after placement, existing stones are moved out of the way.
