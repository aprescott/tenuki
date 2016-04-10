var utils = require("./utils");
var DOMRenderer = require("./dom-renderer");
var NullRenderer = require("./null-renderer");
var Intersection = require("./intersection");
var Scorer = require("./scorer");

var Game = function(boardElement, boardSize) {
  this.boardSize = boardSize || 19;
  this.intersectionGrid = [];
  this.currentPlayer = "black";
  this.moves = [];
  this.captures = {
    black: 0,
    white: 0
  };
  this.renderer = (boardElement ? new DOMRenderer(this, boardElement) : new NullRenderer());
  this.callbacks = {
    postRender: function() {}
  };
  this.deadPoints = [];
  this.territoryPoints = { black: [], white: [] };

  this.setup = function() {
    if (this.boardSize > 19) {
      throw "cannot generate a board size greater than 19";
    }

    this.renderer.setup();

    for (var y = 0; y < this.boardSize; y++) {
      for (var x = 0; x < this.boardSize; x++) {
        var intersection = new Intersection(y, x);
        this.intersectionGrid[y] || (this.intersectionGrid[y] = []);
        this.intersectionGrid[y][x] = intersection;
      }
    }

    this.render();
  };

  this.intersectionAt = function(y, x) {
    return this.intersectionGrid[y][x];
  };

  this.intersections = function() {
    return utils.flatten(this.intersectionGrid);
  };

  this.yCoordinateFor = function(y) {
    return this.boardSize - y;
  };

  this.xCoordinateFor = function(x) {
    var letters = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"];

    return letters[x];
  };

  this.stateFor = function(y, x, captures) {
    var moveInfo = {
      y: y,
      x: x,
      coordinates: this.xCoordinateFor(x) + this.yCoordinateFor(y),
      color: this.currentPlayer,
      pass: false,
      points: this.intersections().map(i => i.duplicate()),
      blackStonesCaptured: this.captures.black,
      whiteStonesCaptured: this.captures.white,
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
      blackStonesCaptured: this.captures.black,
      whiteStonesCaptured: this.captures.white,
      capturedPositions: []
    };
  };

  this.playAt = function(y, x) {
    if (this.isIllegalAt(y, x)) {
      return false;
    }

    this[this.currentPlayer + "At"](y, x);

    var captures = this.clearCapturesFor(y, x);

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
    var intersection = this.intersectionAt(y, x);
    var surroundedEmptyPoint = intersection.isEmpty() && this.neighborsFor(intersection.y, intersection.x).filter(neighbor => neighbor.isEmpty()).length == 0;

    if (!surroundedEmptyPoint) {
      return false;
    }

    var suicide = true;

    var friendlyNeighbors = this.neighborsFor(intersection.y, intersection.x).filter(neighbor => neighbor.isOccupiedWith(this.currentPlayer));

    var someFriendlyNotInAtari = this.neighborsFor(intersection.y, intersection.x).some(neighbor => {
      var inAtari = this.inAtari(neighbor.y, neighbor.x);
      var friendly = neighbor.isOccupiedWith(this.currentPlayer);

      return friendly && !inAtari;
    });

    if (someFriendlyNotInAtari) {
      suicide = false;
    }

    var someEnemyInAtari = this.neighborsFor(intersection.y, intersection.x).some(neighbor => {
      var inAtari = this.inAtari(neighbor.y, neighbor.x);
      var enemy = !neighbor.isOccupiedWith(this.currentPlayer);

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

    var currentMove = this.currentMove();
    var previousMove = this.moves[this.moves.length - 2];

    return currentMove.pass && previousMove.pass;
  };

  this.toggleDeadAt = function(y, x) {
    var alreadyDead = this.isDeadAt(y, x);

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
    var point = this.intersectionAt(y, x);

    return captures.length == 1 && this.groupAt(point.y, point.x).length == 1 && this.inAtari(point.y, point.x);
  };

  this.libertiesAt = function(y, x) {
    var point = this.intersectionAt(y, x);

    var emptyPoints = utils.flatMap(this.groupAt(point.y, point.x), groupPoint => {
      return this.neighborsFor(groupPoint.y, groupPoint.x).filter(intersection => intersection.isEmpty());
    });

    // this is not great, but we need a representation that will be unique-able,
    // and Y-X does the job.
    return utils.unique(emptyPoints.map(emptyPoint => emptyPoint.y + "-" + emptyPoint.x)).length;
  };

  this.groupAt = function(y, x, accumulated) {
    accumulated || (accumulated = []);

    var point = this.intersectionAt(y, x);

    if (accumulated.indexOf(point) > -1) {
      return accumulated
    }

    accumulated.push(point);

    var nonEmptyNeighbors = this.neighborsFor(point.y, point.x).filter(neighbor => !neighbor.isEmpty());

    nonEmptyNeighbors.forEach(neighbor => {
      if (neighbor.sameColorAs(point)) {
        this.groupAt(neighbor.y, neighbor.x, accumulated);
      }
    });

    return accumulated;
  };

  this.neighborsFor = function(y, x) {
    var neighbors = [];

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
    var point = this.intersectionAt(y, x);

    var capturedNeighbors = this.neighborsFor(point.y, point.x).filter(neighbor => {
      return !neighbor.isEmpty && !neighbor.sameColorAs(point) && this.libertiesAt(neighbor.y, neighbor.x) == 0;
    });

    return capturedNeighbors.length > 0
  };

  this.clearCapturesFor = function(y, x) {
    var point = this.intersectionAt(y, x);

    var capturedNeighbors = this.neighborsFor(point.y, point.x).filter(neighbor => {
      return !neighbor.isEmpty() && !neighbor.sameColorAs(point) && this.libertiesAt(neighbor.y, neighbor.x) == 0;
    });

    var capturedStones = utils.flatMap(capturedNeighbors, neighbor => this.groupAt(neighbor.y, neighbor.x));

    capturedStones.forEach(capturedStone => {
      if (capturedStone.isBlack()) {
        this.captures["black"] += 1;
      } else {
        this.captures["white"] += 1;
      }

      this.removeAt(capturedStone.y, capturedStone.x);
    });

    return capturedStones;
  };

  this.isIllegalAt = function(y, x) {
    if (this.moves.length == 0) {
      return false;
    }

    var intersection = this.intersectionAt(y, x);
    var isEmpty = intersection.isEmpty();
    var isCapturing = this.hasCapturesFor(y, x);
    var isSuicide = this.wouldBeSuicide(y, x);
    var koPoint = this.currentMove().koPoint;
    var isKoViolation = koPoint && koPoint.y == y && koPoint.x == x;

    return !isEmpty || isKoViolation || (isSuicide && !isCapturing);
  };

  this.render = function() {
    var currentMove = this.currentMove();

    if (!this.isOver()) {
      this.removeScoringState();
    }

    var points = currentMove ? currentMove.points : this.intersections();

    points.forEach(intersection => {
      if (!currentMove) {
        intersection.setEmpty();
      }

      this.intersectionGrid[intersection.y][intersection.x] = intersection.duplicate();
    });

    if (!currentMove) {
      this.currentPlayer = "black";
      this.captures = { black: 0, white: 0 };
    } else {
      if (currentMove.color == "black") {
        this.currentPlayer = "white";
      } else {
        this.currentPlayer = "black";
      }

      this.captures = {
        black: currentMove.blackStonesCaptured,
        white: currentMove.whiteStonesCaptured
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

  this.checkTerritory = function() {
    this.territoryPoints = { black: [], white: [] };

    var emptyOrDeadPoints = this.intersections().filter(intersection => {
      return intersection.isEmpty() || this.isDeadAt(intersection.y, intersection.x);
    });

    var checkedPoints = [];

    emptyOrDeadPoints.forEach(emptyPoint => {
      if (checkedPoints.indexOf(emptyPoint) > -1) {
        // skip it, we already checked
      } else {
        checkedPoints = checkedPoints.concat(this.checkTerritoryStartingAt(emptyPoint.y, emptyPoint.x));
      }
    });
  };

  this.checkTerritoryStartingAt = function(y, x) {
    var pointsWithBoundary = this.surroundedPointsWithBoundaryAt(y, x);

    var occupiedPoints = pointsWithBoundary.filter(checkedPoint => {
      return !this.isDeadAt(checkedPoint.y, checkedPoint.x) && !checkedPoint.isEmpty();
    });

    var nonOccupiedPoints = pointsWithBoundary.filter(checkedPoint => {
      return this.isDeadAt(checkedPoint.y, checkedPoint.x) || checkedPoint.isEmpty();
    });

    var surroundingColors = utils.unique(occupiedPoints.map(occupiedPoint => occupiedPoint.value));

    if (surroundingColors.length == 1 && surroundingColors[0] != "empty") {
      var territoryColor = surroundingColors[0];

      nonOccupiedPoints.forEach(nonOccupiedPoint => this.markTerritory(nonOccupiedPoint.y, nonOccupiedPoint.x, territoryColor));
    }

    return nonOccupiedPoints;
  };

  this.surroundedPointsWithBoundaryAt = function(y, x, accumulated) {
    accumulated || (accumulated = []);

    var point = this.intersectionAt(y, x);

    if (accumulated.indexOf(point) > -1) {
      return accumulated;
    }

    accumulated.push(point);

    this.neighborsFor(point.y, point.x).forEach(neighbor => {
      if (neighbor.isEmpty() || this.isDeadAt(neighbor.y, neighbor.x)) {
        this.surroundedPointsWithBoundaryAt(neighbor.y, neighbor.x, accumulated);
      } else {
        accumulated.push(neighbor);
      }
    });

    return accumulated;
  };

  this.markTerritory = function(y, x, color) {
    var pointIsMarkedTerritory = this.territoryPoints[color].some(point => point.y == y && point.x == x);

    if (!pointIsMarkedTerritory) {
      this.territoryPoints[color].push({ y: y, x: x });
    }
  };

  this.undo = function() {
    this.moves.pop();
    this.render();
  };
};

module.exports = Game;
