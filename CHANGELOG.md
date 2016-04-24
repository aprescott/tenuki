# Next version

* `data-include-gutter=true` is replaced with `data-include-coordinates=true`.
* Board sizes are no longer specified in the constructor. Instead of `new Game(el, 9)`, it's now `game.setup({ boardSize: 9 })`.
* Correctly handle capturing stones whose last liberty was shared. (#8)
* Support for handicap stones on 9x9, 13x13 and 19x19. (#10)
* `currentPlayer` is now a function, not a property.
