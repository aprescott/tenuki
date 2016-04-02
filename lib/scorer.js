var Scorer = {
  territoryResultFor: function(board) {
    var blackDeadAsCaptures = board.deadPoints.filter(function(deadPoint) { return board.intersectionAt(deadPoint.y, deadPoint.x).isBlack(); });
    var whiteDeadAsCaptures = board.deadPoints.filter(function(deadPoint) { return board.intersectionAt(deadPoint.y, deadPoint.x).isWhite(); });

    return {
      black: board.territoryPoints.black.length + board.captures.white + whiteDeadAsCaptures.length,
      white: board.territoryPoints.white.length + board.captures.black + blackDeadAsCaptures.length
    };
  },

  areaResultFor: function(board) {
    var blackStonesOnTheBoard = board.intersections().filter(function(intersection) { return intersection.isBlack() });
    var whiteStonesOnTheBoard = board.intersections().filter(function(intersection) { return intersection.isWhite() });

    return {
      black: board.territoryPoints.black.length + blackStonesOnTheBoard.length,
      white: board.territoryPoints.white.length + whiteStonesOnTheBoard.length
    };
  }
};

module.exports = Scorer;
