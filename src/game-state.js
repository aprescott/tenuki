import utils from "./utils";
import Intersection from "./intersection";

const GameState = function({ number, y, x, color, pass, points, blackStonesCaptured, whiteStonesCaptured, capturedPositions, koPoint, boardSize }) {
  this.number = number;
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
    if (this.color == "white") {
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

    return utils.unique(capturedStones);
  },

  _updatePoint: function(intersection, points, color) {
    const index = points.indexOf(intersection);

    if (index < 0) {
      throw "unexpected negative index " + index + " when attempting to update " + intersection.y + "," + intersection.x + " to " + color;
    }

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
      number: this.number + 1,
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

  playAt: function(y, x) {
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
      number: this.number + 1,
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

    const withPlayedPoint = new GameState(moveInfo);
    const hasKoPoint = capturedPositions.length == 1 && withPlayedPoint.groupAt(y, x).length == 1 && withPlayedPoint.inAtari(y, x);

    if (hasKoPoint) {
      moveInfo["koPoint"] = { y: capturedPositions[0].y, x: capturedPositions[0].x };
    } else {
      moveInfo["koPoint"] = null;
    }

    return new GameState(moveInfo);
  },

  intersectionAt: function(y, x) {
    return this.points[y*this.boardSize + x];
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

    return utils.unique(emptyPoints).length;
  },

  inAtari: function(y, x) {
    return this.libertiesAt(y, x) == 1;
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

GameState._initialFor = function(boardSize, handicapStones) {
  this._cache = this._cache || {};
  this._cache[boardSize] = this._cache[boardSize] || {};

  if (this._cache[boardSize][handicapStones]) {
    return this._cache[boardSize][handicapStones];
  }

  let emptyPoints = Array.apply(null, Array(boardSize * boardSize));
  emptyPoints = emptyPoints.map((x, i) => {
    return new Intersection(Math.floor(i / boardSize), i % boardSize);
  });

  const hoshiOffset = boardSize > 11 ? 3 : 2;
  const hoshiPoints = {
    topRight:     { y: hoshiOffset,                 x: boardSize - hoshiOffset - 1 },
    bottomLeft:   { y: boardSize - hoshiOffset - 1, x: hoshiOffset },
    bottomRight:  { y: boardSize - hoshiOffset - 1, x: boardSize - hoshiOffset - 1 },
    topLeft:      { y: hoshiOffset,                 x: hoshiOffset },
    middle:       { y: (boardSize + 1)/2 - 1,       x: (boardSize + 1)/2 - 1 },
    middleLeft:   { y: (boardSize + 1)/2 - 1,       x: hoshiOffset },
    middleRight:  { y: (boardSize + 1)/2 - 1,       x: boardSize - hoshiOffset - 1 },
    middleTop:    { y: hoshiOffset,                 x: (boardSize + 1)/2 - 1 },
    middleBottom: { y: boardSize - hoshiOffset - 1, x: (boardSize + 1)/2 - 1 }
  };
  const handicapPlacements = {
    0: [],
    1: [],
    2: [hoshiPoints.topRight, hoshiPoints.bottomLeft],
    3: [hoshiPoints.topRight, hoshiPoints.bottomLeft, hoshiPoints.bottomRight],
    4: [hoshiPoints.topRight, hoshiPoints.bottomLeft, hoshiPoints.bottomRight, hoshiPoints.topLeft],
    5: [hoshiPoints.topRight, hoshiPoints.bottomLeft, hoshiPoints.bottomRight, hoshiPoints.topLeft, hoshiPoints.middle],
    6: [hoshiPoints.topRight, hoshiPoints.bottomLeft, hoshiPoints.bottomRight, hoshiPoints.topLeft, hoshiPoints.middleLeft, hoshiPoints.middleRight],
    7: [hoshiPoints.topRight, hoshiPoints.bottomLeft, hoshiPoints.bottomRight, hoshiPoints.topLeft, hoshiPoints.middleLeft, hoshiPoints.middleRight, hoshiPoints.middle],
    8: [hoshiPoints.topRight, hoshiPoints.bottomLeft, hoshiPoints.bottomRight, hoshiPoints.topLeft, hoshiPoints.middleLeft, hoshiPoints.middleRight, hoshiPoints.middleTop, hoshiPoints.middleBottom],
    9: [hoshiPoints.topRight, hoshiPoints.bottomLeft, hoshiPoints.bottomRight, hoshiPoints.topLeft, hoshiPoints.middleLeft, hoshiPoints.middleRight, hoshiPoints.middleTop, hoshiPoints.middleBottom, hoshiPoints.middle]
  };

  handicapPlacements[handicapStones].forEach(p => {
    emptyPoints[p.y*boardSize + p.x] = new Intersection(p.y, p.x, "black");
  });

  const initialState = new GameState({
    color: handicapStones > 1 ? "black" : "white",
    number: 0,
    points: Object.freeze(emptyPoints),
    blackStonesCaptured: 0,
    whiteStonesCaptured: 0,
    boardSize: boardSize
  });

  this._cache[boardSize][handicapStones] = initialState;
  return initialState;
}

export default GameState;
