const GameState = function({ y, x, color, pass, points, blackStonesCaptured, whiteStonesCaptured, capturedPositions, koPoint }) {
  this.y = y;
  this.x = x;
  this.color = color;
  this.pass = pass;
  this.points = points;
  this.blackStonesCaptured = blackStonesCaptured;
  this.whiteStonesCaptured = whiteStonesCaptured;
  this.capturedPositions = capturedPositions;
  this.koPoint = koPoint;

  Object.freeze(this);
};

GameState.forPlay = function(game, y, x, captures) {
  const moveInfo = {
    y: y,
    x: x,
    color: game.currentPlayer,
    pass: false,
    points: game.intersections().map(i => i.duplicate()),
    blackStonesCaptured: ((game.currentMove() && game.currentMove().blackStonesCaptured) || 0) + (game.isBlackPlaying() ? 0 : captures.length),
    whiteStonesCaptured: ((game.currentMove() && game.currentMove().whiteStonesCaptured) || 0) + (game.isWhitePlaying() ? 0 : captures.length),
    capturedPositions: captures.map(capturedStone => ({ y: capturedStone.y, x: capturedStone.x, color: (game.isBlackPlaying() ? "white" : "black") }))
  };

  const hasKoPoint = captures.length == 1 && game.groupAt(y, x).length == 1 && game.inAtari(y, x);

  if (hasKoPoint) {
    const koPoint = captures[0];
    moveInfo["koPoint"] = { y: koPoint.y, x: koPoint.x };
  } else {
    moveInfo["koPoint"] = null;
  }

  return new GameState(moveInfo);
};

GameState.forPass = function(game) {
  return new GameState({
    y: null,
    x: null,
    color: game.currentPlayer,
    pass: true,
    points: game.intersections().map(i => i.duplicate()),
    blackStonesCaptured: ((game.currentMove() && game.currentMove().blackStonesCaptured) || 0),
    whiteStonesCaptured: ((game.currentMove() && game.currentMove().whiteStonesCaptured) || 0),
    capturedPositions: [],
    koPoint: null
  });
};

export default GameState;
