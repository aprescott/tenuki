import utils from "./utils";
import DOMRenderer from "./dom-renderer";
import NullRenderer from "./null-renderer";
import Intersection from "./intersection";
import Scorer from "./scorer";

export default function Game(boardElement) {
  this._defaultBoardSize = 19;
  this.boardSize = null;
  this._intersectionGrid = [];
  this.currentPlayer = "black";
  this.moves = [];
  this.renderer = (boardElement ? new DOMRenderer(this, boardElement) : new NullRenderer());
  this.callbacks = {
    postRender: function() {}
  };
  this.deadPoints = [];
  this.territoryPoints = { black: [], white: [] };

  this._configureOptions = function({ boardSize = this._defaultBoardSize } = {}) {
    this.boardSize = boardSize;
  };

  this.setup = function(options) {
    this._configureOptions(options);

    if (this.boardSize > 19) {
      throw "cannot generate a board size greater than 19";
    }

    this.renderer.setup();

    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        const intersection = new Intersection(y, x);
        this._intersectionGrid[y] || (this._intersectionGrid[y] = []);
        this._intersectionGrid[y][x] = intersection;
      }
    }

    this.render();
  };

  this.intersectionAt = function(y, x) {
    return this._intersectionGrid[y][x];
  };

  this.intersections = function() {
    return utils.flatten(this._intersectionGrid);
  };

  this.yCoordinateFor = function(y) {
    return this.boardSize - y;
  };

  this.xCoordinateFor = function(x) {
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"];

    return letters[x];
  };

  this.coordinatesFor = function(y, x) {
    return this.xCoordinateFor(x) + this.yCoordinateFor(y);
  };

  this.stateFor = function(y, x, captures) {
    const moveInfo = {
      y: y,
      x: x,
      coordinates: this.coordinatesFor(y, x),
      color: this.currentPlayer,
      pass: false,
      points: this.intersections().map(i => i.duplicate()),
      blackStonesCaptured: ((this.currentMove() && this.currentMove().blackStonesCaptured) || 0) + (this.isBlackPlaying() ? 0 : captures.length),
      whiteStonesCaptured: ((this.currentMove() && this.currentMove().whiteStonesCaptured) || 0) + (this.isWhitePlaying() ? 0 : captures.length),
      capturedPositions: captures.map(capturedStone => ({ y: capturedStone.y, x: capturedStone.x, color: (this.isBlackPlaying() ? "white" : "black") }))
    };

    if (this.isKoFrom(y, x, captures)) {
      moveInfo["koPoint"] = { y: captures[0].y, x: captures[0].x };
    } else {
      moveInfo["koPoint"] = null;
    }

    return moveInfo;
  };

  this.whiteAt = function(y, x) {
    this.intersectionAt(y, x).setWhite();
  };
  this.blackAt = function(y, x) {
    this.intersectionAt(y, x).setBlack();
  };
  this.removeAt = function(y, x) {
    this.intersectionAt(y, x).setEmpty();
  };

  this.stateForPass = function() {
    return {
      y: null,
      x: null,
      coordinates: null,
      color: this.currentPlayer,
      pass: true,
      points: this.intersections().map(i => i.duplicate()),
      blackStonesCaptured: ((this.currentMove() && this.currentMove().blackStonesCaptured) || 0),
      whiteStonesCaptured: ((this.currentMove() && this.currentMove().whiteStonesCaptured) || 0),
      capturedPositions: []
    };
  };

  this.playAt = function(y, x) {
    if (this.isIllegalAt(y, x)) {
      return false;
    }

    this[this.currentPlayer + "At"](y, x);

    const captures = this.clearCapturesFor(y, x);

    this.moves.push(this.stateFor(y, x, captures));
    this.render();

    return true;
  };

  this.currentMove = function() {
    return this.moves[this.moves.length - 1];
  };

  this.isWhitePlaying = function() {
    return this.currentPlayer == "white";
  };

  this.isBlackPlaying = function() {
    return this.currentPlayer == "black";
  };

  this.inAtari = function(y, x) {
    return this.libertiesAt(y, x) == 1;
  }

  this.wouldBeSuicide = function(y, x) {
    const intersection = this.intersectionAt(y, x);
    const surroundedEmptyPoint = intersection.isEmpty() && this.neighborsFor(intersection.y, intersection.x).filter(neighbor => neighbor.isEmpty()).length == 0;

    if (!surroundedEmptyPoint) {
      return false;
    }

    let suicide = true;

    const friendlyNeighbors = this.neighborsFor(intersection.y, intersection.x).filter(neighbor => neighbor.isOccupiedWith(this.currentPlayer));

    const someFriendlyNotInAtari = this.neighborsFor(intersection.y, intersection.x).some(neighbor => {
      const inAtari = this.inAtari(neighbor.y, neighbor.x);
      const friendly = neighbor.isOccupiedWith(this.currentPlayer);

      return friendly && !inAtari;
    });

    if (someFriendlyNotInAtari) {
      suicide = false;
    }

    const someEnemyInAtari = this.neighborsFor(intersection.y, intersection.x).some(neighbor => {
      const inAtari = this.inAtari(neighbor.y, neighbor.x);
      const enemy = !neighbor.isOccupiedWith(this.currentPlayer);

      return enemy && inAtari;
    });

    if (someEnemyInAtari) {
      suicide = false;
    }

    return suicide;
  };

  this.pass = function() {
    if (!this.isOver()) {
      this.moves.push(this.stateForPass())
      this.render();
    }
  };

  this.isOver = function() {
    if (this.moves.length < 2) {
      return false;
    }

    const currentMove = this.currentMove();
    const previousMove = this.moves[this.moves.length - 2];

    return currentMove.pass && previousMove.pass;
  };

  this.toggleDeadAt = function(y, x) {
    const alreadyDead = this.isDeadAt(y, x);

    this.groupAt(y, x).forEach(intersection => {
      if (alreadyDead) {
        this.deadPoints = this.deadPoints.filter(dead => !(dead.y == intersection.y && dead.x == intersection.x));
      } else {
        this.deadPoints.push({ y: intersection.y, x: intersection.x });
      }
    });

    this.render();
  }

  this.isDeadAt = function(y, x) {
    return this.deadPoints.some(dead => dead.y == y && dead.x == x);
  };

  this.territoryScore = function() {
    return Scorer.territoryResultFor(this);
  };

  this.areaScore = function() {
    return Scorer.areaResultFor(this);
  };

  this.isKoFrom = function(y, x, captures) {
    const point = this.intersectionAt(y, x);

    return captures.length == 1 && this.groupAt(point.y, point.x).length == 1 && this.inAtari(point.y, point.x);
  };

  this.libertiesAt = function(y, x) {
    const point = this.intersectionAt(y, x);

    const emptyPoints = utils.flatMap(this.groupAt(point.y, point.x), groupPoint => {
      return this.neighborsFor(groupPoint.y, groupPoint.x).filter(intersection => intersection.isEmpty());
    });

    // this is not great, but we need a representation that will be unique-able,
    // and Y-X does the job.
    return utils.unique(emptyPoints.map(emptyPoint => emptyPoint.y + "-" + emptyPoint.x)).length;
  };

  this.groupAt = function(y, x) {
    const startingPoint = this.intersectionAt(y, x);

    const [group, _] = this.partitionTraverse(startingPoint, neighbor => {
      return neighbor.sameColorAs(startingPoint)
    });

    return group;
  };

  this.neighborsFor = function(y, x) {
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
  };

  this.hasCapturesFor = function(y, x) {
    const point = this.intersectionAt(y, x);

    const capturedNeighbors = this.neighborsFor(point.y, point.x).filter(neighbor => {
      return !neighbor.isEmpty && !neighbor.sameColorAs(point) && this.libertiesAt(neighbor.y, neighbor.x) == 0;
    });

    return capturedNeighbors.length > 0
  };

  this.clearCapturesFor = function(y, x) {
    const point = this.intersectionAt(y, x);

    const capturedNeighbors = this.neighborsFor(point.y, point.x).filter(neighbor => {
      return !neighbor.isEmpty() && !neighbor.sameColorAs(point) && this.libertiesAt(neighbor.y, neighbor.x) == 0;
    });

    const capturedStones = utils.flatMap(capturedNeighbors, neighbor => this.groupAt(neighbor.y, neighbor.x));

    capturedStones.forEach(capturedStone => {
      this.removeAt(capturedStone.y, capturedStone.x);
    });

    return capturedStones;
  };

  this.isIllegalAt = function(y, x) {
    if (this.moves.length == 0) {
      return false;
    }

    const intersection = this.intersectionAt(y, x);
    const isEmpty = intersection.isEmpty();
    const isCapturing = this.hasCapturesFor(y, x);
    const isSuicide = this.wouldBeSuicide(y, x);
    const koPoint = this.currentMove().koPoint;
    const isKoViolation = koPoint && koPoint.y == y && koPoint.x == x;

    return !isEmpty || isKoViolation || (isSuicide && !isCapturing);
  };

  this.render = function() {
    const currentMove = this.currentMove();

    if (!this.isOver()) {
      this.removeScoringState();
    }

    const points = currentMove ? currentMove.points : this.intersections();

    points.forEach(intersection => {
      if (!currentMove) {
        intersection.setEmpty();
      }

      this._intersectionGrid[intersection.y][intersection.x] = intersection.duplicate();
    });

    if (!currentMove) {
      this.currentPlayer = "black";
    } else {
      if (currentMove.color == "black") {
        this.currentPlayer = "white";
      } else {
        this.currentPlayer = "black";
      }
    }

    this.checkTerritory();
    this.renderer.render();
    this.callbacks.postRender(this);
  };

  this.removeScoringState = function() {
    this.deadPoints = [];
    this.territoryPoints = { black: [], white: [] };
  };

  // Iterative depth-first search traversal. Start from
  // startingPoint, iteratively follow all neighbors.
  // If inclusionConditionis met for a neighbor, include it
  // otherwise, exclude it. At the end, return two arrays:
  // One for the included neighbors, another for the remaining neighbors.
  this.partitionTraverse = function(startingPoint, inclusionCondition) {
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
  };

  this.checkTerritory = function() {
    this.territoryPoints = { black: [], white: [] };

    const emptyOrDeadPoints = this.intersections().filter(intersection => {
      return intersection.isEmpty() || this.isDeadAt(intersection.y, intersection.x);
    });

    if (!this.isOver() || emptyOrDeadPoints.length == 0) {
      return;
    }

    var checkedPoints = [];
    var pointsToCheck = emptyOrDeadPoints.map(i => i.duplicate());

    while (pointsToCheck.length > 0) {
      const nextPoint = pointsToCheck.pop();
      checkedPoints = checkedPoints.concat(this.checkTerritoryStartingAt(nextPoint.y, nextPoint.x));
      pointsToCheck = emptyOrDeadPoints.filter(i => checkedPoints.indexOf(i) < 0);
    }
  };

  this.checkTerritoryStartingAt = function(y, x) {
    const startingPoint = this.intersectionAt(y, x);

    const [nonOccupiedPoints, occupiedPoints] = this.partitionTraverse(startingPoint, neighbor => {
      return neighbor.isEmpty() || this.isDeadAt(neighbor.y, neighbor.x);
    });

    const surroundingColors = utils.unique(occupiedPoints.map(occupiedPoint => occupiedPoint.value));

    if (surroundingColors.length == 1 && surroundingColors[0] != "empty") {
      const territoryColor = surroundingColors[0];

      nonOccupiedPoints.forEach(nonOccupiedPoint => this.markTerritory(nonOccupiedPoint.y, nonOccupiedPoint.x, territoryColor));
    }

    return nonOccupiedPoints;
  };

  this.markTerritory = function(y, x, color) {
    const pointIsMarkedTerritory = this.territoryPoints[color].some(point => point.y == y && point.x == x);

    if (!pointIsMarkedTerritory) {
      this.territoryPoints[color].push({ y: y, x: x });
    }
  };

  this.undo = function() {
    this.moves.pop();
    this.render();
  };
};
