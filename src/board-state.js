import utils from "./utils";
import Intersection from "./intersection";
import Zobrist from "./zobrist";

const BoardState = function({ moveNumber, playedPoint, color, pass, blackPassStones, whitePassStones, intersections, blackStonesCaptured, whiteStonesCaptured, capturedPositions, koPoint, boardSize }) {
  this.moveNumber = moveNumber;
  this.playedPoint = playedPoint;
  this.color = color;
  this.pass = pass;
  this.blackPassStones = blackPassStones;
  this.whitePassStones = whitePassStones;
  this.intersections = intersections;
  this.blackStonesCaptured = blackStonesCaptured;
  this.whiteStonesCaptured = whiteStonesCaptured;
  this.capturedPositions = capturedPositions;
  this.koPoint = koPoint;
  this.boardSize = boardSize;
  this._positionHash = Zobrist.hash(boardSize, intersections);

  Object.freeze(this);
};

BoardState.prototype = {
  copyWithAttributes: function(attrs) {
    const retrieveProperties = ({ moveNumber, playedPoint, color, pass, blackPassStones, whitePassStones, intersections, blackStonesCaptured, whiteStonesCaptured, capturedPositions, koPoint, boardSize }) => ({ moveNumber, playedPoint, color, pass, blackPassStones, whitePassStones, intersections, blackStonesCaptured, whiteStonesCaptured, capturedPositions, koPoint, boardSize });
    const existingAttrs = retrieveProperties(this);
    const newAttrs = retrieveProperties(Object.assign(existingAttrs, attrs));

    return new BoardState(newAttrs);
  },

  _capturesFrom: function(y, x, color) {
    const capturedNeighbors = this.neighborsFor(y, x).filter(neighbor => {
      // TODO: this value of 1 is potentially weird.
      // we're checking against the move before the stone we just played
      // where this space is not occupied yet. things should possibly be
      // reworked.
      return !neighbor.isEmpty() && neighbor.value !== color && this.libertiesAt(neighbor.y, neighbor.x) === 1;
    });

    const capturedStones = utils.flatMap(capturedNeighbors, neighbor => this.groupAt(neighbor.y, neighbor.x));

    return utils.unique(capturedStones);
  },

  _updateIntersection: function(intersection, intersections, color) {
    return intersections.map(i => {
      if (i.y === intersection.y && i.x === intersection.x) {
        return new Intersection(i.y, i.x, color);
      } else {
        return i;
      }
    });
  },

  _removeIntersection: function(intersection, intersections) {
    return this._updateIntersection(intersection, intersections, "empty");
  },

  _withoutIntersectionsMatching: function(condition) {
    const newPoints = this.intersections.map(i => {
      if (condition(i)) {
        return new Intersection(i.y, i.x, "empty");
      } else {
        return i;
      }
    });

    return this._withNewPoints(newPoints);
  },

  _withNewPoints: function(newPoints) {
    return this.copyWithAttributes({ intersections: newPoints });
  },

  nextColor: function() {
    if (this.color === "black") {
      return "white";
    } else {
      return "black";
    }
  },

  yCoordinateFor: function(y) {
    return this.boardSize - y;
  },

  xCoordinateFor: function(x) {
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"];

    return letters[x];
  },

  playPass: function(color) {
    const stateInfo = {
      moveNumber: this.moveNumber + 1,
      playedPoint: null,
      color: color,
      pass: true,
      blackPassStones: this.blackPassStones,
      whitePassStones: this.whitePassStones,
      intersections: this.intersections,
      blackStonesCaptured: this.blackStonesCaptured,
      whiteStonesCaptured: this.whiteStonesCaptured,
      capturedPositions: [],
      koPoint: null,
      boardSize: this.boardSize
    };

    stateInfo[color + "PassStones"] += 1;

    const newState = new BoardState(stateInfo);

    return newState;
  },

  _simpleKoPoint: function() {
    let simpleKoPoint = null;

    if (this.playedPoint) {
      const { y, x } = this.playedPoint;

      if (this.capturedPositions.length === 1 && this.groupAt(y, x).length === 1 && this.inAtari(y, x)) {
        simpleKoPoint = this.capturedPositions[0];
      }
    }

    return simpleKoPoint;
  },

  playAt: function(y, x, playedColor) {
    const capturedPositions = this._capturesFrom(y, x, playedColor);
    let playedPoint = this.intersectionAt(y, x);
    let newPoints = this.intersections;

    capturedPositions.forEach(i => {
      newPoints = this._removeIntersection(i, newPoints);
    });

    newPoints = this._updateIntersection(playedPoint, newPoints, playedColor);

    const newTotalBlackCaptured = this.blackStonesCaptured + (playedColor === "black" ? 0 : capturedPositions.length);
    const newTotalWhiteCaptured = this.whiteStonesCaptured + (playedColor === "white" ? 0 : capturedPositions.length);

    const boardSize = this.boardSize;

    const moveInfo = {
      moveNumber: this.moveNumber + 1,
      playedPoint: Object.freeze({ y, x }),
      color: playedColor,
      pass: false,
      blackPassStones: this.blackPassStones,
      whitePassStones: this.whitePassStones,
      intersections: newPoints,
      blackStonesCaptured: newTotalBlackCaptured,
      whiteStonesCaptured: newTotalWhiteCaptured,
      capturedPositions: capturedPositions,
      boardSize: boardSize
    };

    const withPlayedPoint = new BoardState(moveInfo);

    const possibleKoPoint = withPlayedPoint._simpleKoPoint();

    if (possibleKoPoint) {
      moveInfo["koPoint"] = { y: possibleKoPoint.y, x: possibleKoPoint.x };
    } else {
      moveInfo["koPoint"] = null;
    }

    return new BoardState(moveInfo);
  },

  intersectionAt: function(y, x) {
    if (y >= this.boardSize || x >= this.boardSize) {
      throw new Error(`Intersection at (${y}, ${x}) would be outside the board`);
    }

    if (y < 0 || x < 0) {
      throw new Error(`Intersection position cannot be negative, but was given (${y}, ${x})`);
    }

    return this.intersections[y*this.boardSize + x];
  },

  groupAt: function(y, x) {
    const startingPoint = this.intersectionAt(y, x);

    const [group, _] = this.partitionTraverse(startingPoint, neighbor => {
      return neighbor.sameColorAs(startingPoint);
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
    return this.libertiesAt(y, x) === 1;
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

  positionSameAs: function(otherState) {
    return this._positionHash === otherState._positionHash && this.intersections.every(point => {
      return point.sameColorAs(otherState.intersectionAt(point.y, point.x));
    });
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

    return [checkedPoints, utils.unique(boundaryPoints)];
  }
};

BoardState._initialFor = function(boardSize, handicapStones) {
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

  const initialState = new BoardState({
    color: handicapStones > 1 ? "black" : "white",
    moveNumber: 0,
    intersections: Object.freeze(emptyPoints),
    blackStonesCaptured: 0,
    whiteStonesCaptured: 0,
    whitePassStones: 0,
    blackPassStones: 0,
    boardSize: boardSize
  });

  this._cache[boardSize][handicapStones] = initialState;
  return initialState;
};

export default BoardState;
