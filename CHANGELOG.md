# Next version

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
