import utils from "./utils";
import Intersection from "./intersection";

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
  _nextColor: function() {
    if (!this.color || this.color == "white") {
      return "black";
    } else {
      return "white";
    }
  },

  _capturesFrom: function(y, x, color) {
    const point = this.intersectionAt(y, x);

    const capturedNeighbors = this.neighborsFor(point.y, point.x).filter(neighbor => {
      // TODO: this value of 1 is potentially weird.
      // we're checking against the move before the stone we just played
      // where this space is not occupied yet. things should possibly be
      // reworked.
      return !neighbor.isEmpty() && neighbor.value != color && this.libertiesAt(neighbor.y, neighbor.x) == 1;
    });

    const capturedStones = utils.flatMap(capturedNeighbors, neighbor => this.groupAt(neighbor.y, neighbor.x));

    return capturedStones;
  },

  _updatePoint: function(intersection, points, color) {
    const index = points.indexOf(intersection);

    const prefix = points.slice(0, index);
    const newPoint = new Intersection(intersection.y, intersection.x, color);
    const suffix = points.slice(index + 1);

    return prefix.concat([newPoint], suffix);
  },

  _removePoint: function(intersection, points) {
    return this._updatePoint(intersection, points, "empty");
  },

  playPass: function() {
    const newState = new GameState({
      y: null,
      x: null,
      color: this._nextColor(),
      pass: true,
      points: this.points,
      blackStonesCaptured: this.blackStonesCaptured,
      whiteStonesCaptured: this.whiteStonesCaptured,
      capturedPositions: [],
      koPoint: null,
      boardSize: this.boardSize
    });

    return newState;
  },

  playAt: function(y, x, game) {
    const playedColor = this._nextColor();
    const capturedPositions = this._capturesFrom(y, x, playedColor);
    let playedPoint = this.intersectionAt(y, x);
    let newPoints = this.points;

    capturedPositions.forEach(i => {
      newPoints = this._removePoint(i, newPoints);
    });

    newPoints = this._updatePoint(playedPoint, newPoints, playedColor);

    const newTotalBlackCaptured = this.blackStonesCaptured + (playedColor == "black" ? 0 : capturedPositions.length);
    const newTotalWhiteCaptured = this.whiteStonesCaptured + (playedColor == "white" ? 0 : capturedPositions.length);

    const boardSize = this.boardSize;

    const moveInfo = {
      y: y,
      x: x,
      color: playedColor,
      pass: false,
      points: newPoints,
      blackStonesCaptured: newTotalBlackCaptured,
      whiteStonesCaptured: newTotalWhiteCaptured,
      capturedPositions: capturedPositions,
      boardSize: boardSize
    };

    // TODO: haaacks.
    // this is needed because the game
    // has to calculate the liberties
    // of the stone _we're playing right now_,
    // but "before" it's been played
    game.moves.push(new GameState(moveInfo));
    const hasKoPoint = capturedPositions.length == 1 && game.groupAt(y, x).length == 1 && game.inAtari(y, x);
    game.moves.pop();

    if (hasKoPoint) {
      moveInfo["koPoint"] = { y: capturedPositions[0].y, x: capturedPositions[0].x };
    } else {
      moveInfo["koPoint"] = null;
    }

    return new GameState(moveInfo);
  },

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

  libertiesAt: function(y, x) {
    const point = this.intersectionAt(y, x);

    const emptyPoints = utils.flatMap(this.groupAt(point.y, point.x), groupPoint => {
      return this.neighborsFor(groupPoint.y, groupPoint.x).filter(intersection => intersection.isEmpty());
    });

    // this is not great, but we need a representation that will be unique-able,
    // and Y-X does the job.
    return utils.unique(emptyPoints.map(emptyPoint => emptyPoint.y + "-" + emptyPoint.x)).length;
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
    var pointsToCheck = emptyOrDeadPoints;

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

GameState.initialFor = function(game) {
  let emptyPoints = [];

  for (let y = 0; y < game.boardSize; y++) {
    for (let x = 0; x < game.boardSize; x++) {
      const intersection = new Intersection(y, x);
      emptyPoints[y] || (emptyPoints[y] = []);
      emptyPoints[y][x] = intersection;
    }
  }

  return new GameState({
    points: Object.freeze(utils.flatten(emptyPoints)),
    blackStonesCaptured: 0,
    whiteStonesCaptured: 0,
    boardSize: game.boardSize
  });
}

export default GameState;
