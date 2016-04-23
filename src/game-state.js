import utils from "./utils";

const GameState = function({ y, x, color, pass, points, blackStonesCaptured, whiteStonesCaptured, capturedPositions, koPoint, boardSize }) {
  this.y = y;
  this.x = x;
  this.color = color;
  this.pass = pass;
  // "points" -- we can do better
  this.points = points;
  // we can probably do better here, too
  this.blackStonesCaptured = blackStonesCaptured;
  this.whiteStonesCaptured = whiteStonesCaptured;
  this.capturedPositions = capturedPositions;
  this.koPoint = koPoint;
  this.boardSize = boardSize;

  Object.freeze(this);
};

GameState.prototype = {
  intersectionAt: function(y, x) {
    // TODO: this is going to lead to mn-ish performance. not good.
    return this.points.filter(i => i.y == y && i.x == x)[0];
  },

  groupAt: function(y, x) {
    const startingPoint = this.intersectionAt(y, x);

    const [group, _] = this.partitionTraverse(startingPoint, neighbor => {
      return neighbor.sameColorAs(startingPoint)
    });

    return group;
  },

  neighborsFor: function(y, x) {
    const neighbors = [];

    if (x > 0) {
      neighbors.push(this.intersectionAt(y, x - 1));
    }

    if (x < (this.boardSize - 1)) {
      neighbors.push(this.intersectionAt(y, x + 1));
    }

    if (y > 0) {
      neighbors.push(this.intersectionAt(y - 1, x));
    }

    if (y < (this.boardSize - 1)) {
      neighbors.push(this.intersectionAt(y + 1, x));
    }

    return neighbors;
  },

  // Iterative depth-first search traversal. Start from
  // startingPoint, iteratively follow all neighbors.
  // If inclusionConditionis met for a neighbor, include it
  // otherwise, exclude it. At the end, return two arrays:
  // One for the included neighbors, another for the remaining neighbors.
  partitionTraverse: function(startingPoint, inclusionCondition) {
    let checkedPoints = [];
    let boundaryPoints = [];
    let pointsToCheck = [];

    pointsToCheck.push(startingPoint);

    while (pointsToCheck.length > 0) {
      const point = pointsToCheck.pop();

      if (checkedPoints.indexOf(point) > -1) {
        // skip it, we already checked
      } else {
        checkedPoints.push(point);

        this.neighborsFor(point.y, point.x).forEach(neighbor => {
          if (checkedPoints.indexOf(neighbor) > -1) {
            // skip this neighbor, we already checked it
          } else {
            if (inclusionCondition(neighbor)) {
              pointsToCheck.push(neighbor);
            } else {
              boundaryPoints.push(neighbor);
            }
          }
        });
      }
    }

    return [checkedPoints, boundaryPoints];
  },

  territory: function(game) {
    const emptyOrDeadPoints = this.points.filter(intersection => {
      return intersection.isEmpty() || game.isDeadAt(intersection.y, intersection.x);
    });

    if (emptyOrDeadPoints.length == 0) {
      return;
    }

    var checkedPoints = [];
    var territoryPoints = { black: [], white: [] };
    var pointsToCheck = emptyOrDeadPoints.map(i => i.duplicate());

    while (pointsToCheck.length > 0) {
      const nextPoint = pointsToCheck.pop();
      checkedPoints = checkedPoints.concat(this.checkTerritoryStartingAt(game, nextPoint.y, nextPoint.x, territoryPoints));
      pointsToCheck = emptyOrDeadPoints.filter(i => checkedPoints.indexOf(i) < 0);
    }

    return({
      black: territoryPoints.black.map(i => ({ y: i.y, x: i.x })),
      white: territoryPoints.white.map(i => ({ y: i.y, x: i.x }))
    });
  },

  checkTerritoryStartingAt: function(game, y, x, territoryPoints) {
    const startingPoint = this.intersectionAt(y, x);

    const [nonOccupiedPoints, occupiedPoints] = this.partitionTraverse(startingPoint, neighbor => {
      return neighbor.isEmpty() || game.isDeadAt(neighbor.y, neighbor.x);
    });

    const surroundingColors = utils.unique(occupiedPoints.map(occupiedPoint => occupiedPoint.value));

    if (surroundingColors.length == 1 && surroundingColors[0] != "empty") {
      const territoryColor = surroundingColors[0];

      territoryPoints[territoryColor] = territoryPoints[territoryColor].concat(nonOccupiedPoints);
    }

    return nonOccupiedPoints;
  }
}

GameState.forPlay = function(game, y, x, captures) {
  const moveInfo = {
    y: y,
    x: x,
    color: game.currentPlayer,
    pass: false,
    points: utils.flatten(game._intersectionGrid).map(i => i.duplicate()),
    blackStonesCaptured: ((game.currentMove() && game.currentMove().blackStonesCaptured) || 0) + (game.isBlackPlaying() ? 0 : captures.length),
    whiteStonesCaptured: ((game.currentMove() && game.currentMove().whiteStonesCaptured) || 0) + (game.isWhitePlaying() ? 0 : captures.length),
    capturedPositions: captures.map(capturedStone => ({ y: capturedStone.y, x: capturedStone.x, color: (game.isBlackPlaying() ? "white" : "black") })),
    boardSize: game.boardSize
  };

  // TODO: haaacks.
  // this is needed because the game
  // has to calculate the liberties
  // of the stone _we're playing right now_,
  // but "before" it's been played
  game.moves.push(new GameState(moveInfo));
  const hasKoPoint = captures.length == 1 && game.groupAt(y, x).length == 1 && game.inAtari(y, x);
  game.moves.pop();

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
    points: utils.flatten(game._intersectionGrid).map(i => i.duplicate()),
    blackStonesCaptured: ((game.currentMove() && game.currentMove().blackStonesCaptured) || 0),
    whiteStonesCaptured: ((game.currentMove() && game.currentMove().whiteStonesCaptured) || 0),
    capturedPositions: [],
    koPoint: null,
    boardSize: game.boardSize
  });
};

export default GameState;
