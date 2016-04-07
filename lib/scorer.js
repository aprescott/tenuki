var Scorer = {
  territoryResultFor: function(game) {
    var blackDeadAsCaptures = game.deadPoints.filter(function(deadPoint) { return game.intersectionAt(deadPoint.y, deadPoint.x).isBlack(); });
    var whiteDeadAsCaptures = game.deadPoints.filter(function(deadPoint) { return game.intersectionAt(deadPoint.y, deadPoint.x).isWhite(); });

    return {
      black: game.territoryPoints.black.length + game.captures.white + whiteDeadAsCaptures.length,
      white: game.territoryPoints.white.length + game.captures.black + blackDeadAsCaptures.length
    };
  },

  areaResultFor: function(game) {
    var blackStonesOnTheBoard = game.intersections().filter(function(intersection) { return intersection.isBlack() && !game.isDeadAt(intersection.y, intersection.x); });
    var whiteStonesOnTheBoard = game.intersections().filter(function(intersection) { return intersection.isWhite() && !game.isDeadAt(intersection.y, intersection.x); });

    return {
      black: game.territoryPoints.black.length + blackStonesOnTheBoard.length,
      white: game.territoryPoints.white.length + whiteStonesOnTheBoard.length
    };
  }
};

module.exports = Scorer;
