# Next version

* `data-include-gutter=true` is replaced with `data-include-coordinates=true`.
* Board sizes are no longer specified in the constructor. Instead of `new Game(el, 9)`, it's now `game.setup({ boardSize: 9 })`.
* `game.captures` is removed. To get capture totals, use `currentMove().whiteStonesCaptured` and `currentMove().blackStonesCaptured`.
