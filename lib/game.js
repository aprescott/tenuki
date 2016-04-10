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
    var game = this;

    if (game.boardSize > 19) {
      throw "cannot generate a board size greater than 19";
    }

    game.renderer.setup();

    for (var y = 0; y < game.boardSize; y++) {
      for (var x = 0; x < game.boardSize; x++) {
        var intersection = new Intersection(y, x);
        game.intersectionGrid[y] || (game.intersectionGrid[y] = []);
        game.intersectionGrid[y][x] = intersection;
      }
    }

    game.render();
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
    letters = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"];

    return letters[x];
  };

  this.stateFor = function(y, x, captures) {
    var game = this;

    var moveInfo = {
      y: y,
      x: x,
      coordinates: this.xCoordinateFor(x) + this.yCoordinateFor(y),
      color: game.currentPlayer,
      pass: false,
      points: game.intersections().map(function(i) { return i.duplicate(); }),
      blackStonesCaptured: game.captures.black,
      whiteStonesCaptured: game.captures.white,
      capturedPositions: captures.map(function(capturedStone) {
        return { y: capturedStone.y, x: capturedStone.x, color: (game.isBlackPlaying() ? "white" : "black") }
      })
    };

    if (game.isKoFrom(y, x, captures)) {
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
    var game = this;

    return {
      y: null,
      x: null,
      coordinates: null,
      color: game.currentPlayer,
      pass: true,
      points: game.intersections().map(function(i) { return i.duplicate(); }),
      blackStonesCaptured: game.captures.black,
      whiteStonesCaptured: game.captures.white,
      capturedPositions: []
    };
  };

  this.playAt = function(y, x) {
    var game = this;

    if (game.isIllegalAt(y, x)) {
      return false;
    }

    game[game.currentPlayer + "At"](y, x);

    var captures = game.clearCapturesFor(y, x);

    game.moves.push(game.stateFor(y, x, captures));
    game.render();

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
    var game = this;
    var intersection = game.intersectionAt(y, x);
    var surroundedEmptyPoint = intersection.isEmpty() && game.neighborsFor(intersection.y, intersection.x).filter(function(neighbor) { return neighbor.isEmpty() }).length == 0;

    if (!surroundedEmptyPoint) {
      return false;
    }

    suicide = true;

    var friendlyNeighbors = game.neighborsFor(intersection.y, intersection.x).filter(function(neighbor) {
      return neighbor.isOccupiedWith(game.currentPlayer);
    });

    var someFriendlyNotInAtari = game.neighborsFor(intersection.y, intersection.x).some(function(neighbor) {
      var inAtari = game.inAtari(neighbor.y, neighbor.x);
      var friendly = neighbor.isOccupiedWith(game.currentPlayer);

      return friendly && !inAtari;
    });

    if (someFriendlyNotInAtari) {
      suicide = false;
    }

    var someEnemyInAtari = game.neighborsFor(intersection.y, intersection.x).some(function(neighbor) {
      var inAtari = game.inAtari(neighbor.y, neighbor.x);
      var enemy = !neighbor.isOccupiedWith(game.currentPlayer);

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
    var game = this;

    var alreadyDead = game.isDeadAt(y, x);

    game.groupAt(y, x).forEach(function(intersection) {
      if (alreadyDead) {
        game.deadPoints = game.deadPoints.filter(function(dead) { return !(dead.y == intersection.y && dead.x == intersection.x) });
      } else {
        game.deadPoints.push({ y: intersection.y, x: intersection.x });
      }
    });

    game.render();
  }

  this.isDeadAt = function(y, x) {
    var game = this;

    return game.deadPoints.some(function(dead) {
      return dead.y == y && dead.x == x;
    });
  };

  this.territoryScore = function() {
    return Scorer.territoryResultFor(this);
  };

  this.areaScore = function() {
    return Scorer.areaResultFor(this);
  };

  this.isKoFrom = function(y, x, captures) {
    var game = this;
    var point = game.intersectionAt(y, x);

    return captures.length == 1 && this.groupAt(point.y, point.x).length == 1 && game.inAtari(point.y, point.x);
  };

  this.libertiesAt = function(y, x) {
    var game = this;
    var point = game.intersectionAt(y, x);

    var emptyPoints = utils.flatMap(this.groupAt(point.y, point.x), function(groupPoint) {
      return game.neighborsFor(groupPoint.y, groupPoint.x).filter(function(intersection) {
        return intersection.isEmpty();
      })
    });

    // this is not great, but we need a representation that will be unique-able,
    // and Y-X does the job.
    return utils.unique(emptyPoints.map(function(emptyPoint) { return emptyPoint.y + "-" + emptyPoint.x; })).length;
  };

  this.groupAt = function(y, x, accumulated) {
    accumulated || (accumulated = []);

    var game = this;
    var point = game.intersectionAt(y, x);

    if (accumulated.indexOf(point) > -1) {
      return accumulated
    }

    accumulated.push(point);

    game.neighborsFor(point.y, point.x).filter(function(neighbor) {
      return !neighbor.isEmpty();
    }).forEach(function(neighbor) {
      if (neighbor.sameColorAs(point)) {
        game.groupAt(neighbor.y, neighbor.x, accumulated);
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
    var game = this;
    var point = game.intersectionAt(y, x);

    var capturedNeighbors = game.neighborsFor(point.y, point.x).filter(function(neighbor) {
      return !neighbor.isEmpty && !neighbor.sameColorAs(point) && game.libertiesAt(neighbor.y, neighbor.x) == 0;
    });

    return capturedNeighbors.length > 0
  };

  this.clearCapturesFor = function(y, x) {
    var game = this;
    var point = game.intersectionAt(y, x);

    var capturedNeighbors = game.neighborsFor(point.y, point.x).filter(function(neighbor) {
      return !neighbor.isEmpty() && !neighbor.sameColorAs(point) && game.libertiesAt(neighbor.y, neighbor.x) == 0;
    });

    var capturedStones = utils.flatMap(capturedNeighbors, function(neighbor) {
      return game.groupAt(neighbor.y, neighbor.x);
    });

    capturedStones.forEach(function(capturedStone) {
      if (capturedStone.isBlack()) {
        game.captures["black"] += 1;
      } else {
        game.captures["white"] += 1;
      }

      game.removeAt(capturedStone.y, capturedStone.x);
    });

    return capturedStones;
  };

  this.isIllegalAt = function(y, x) {
    if (this.moves.length == 0) {
      return false;
    }

    var game = this;
    var intersection = game.intersectionAt(y, x);

    var isEmpty = intersection.isEmpty();
    var isCapturing = this.hasCapturesFor(y, x);
    var isSuicide = this.wouldBeSuicide(y, x);
    var koPoint = this.currentMove().koPoint;
    var isKoViolation = koPoint && koPoint.y == y && koPoint.x == x;

    return !isEmpty || isKoViolation || (isSuicide && !isCapturing);
  };

  this.render = function() {
    var game = this;
    var currentMove = game.currentMove();

    if (!game.isOver()) {
      game.removeScoringState();
    }

    var points = currentMove ? currentMove.points : game.intersections();

    points.forEach(function(intersection) {
      if (!currentMove) {
        intersection.setEmpty();
      }

      game.intersectionGrid[intersection.y][intersection.x] = intersection.duplicate();
    });

    if (!currentMove) {
      game.currentPlayer = "black";
      game.captures = { black: 0, white: 0 };
    } else {
      if (currentMove.color == "black") {
        game.currentPlayer = "white";
      } else {
        game.currentPlayer = "black";
      }

      game.captures = {
        black: currentMove.blackStonesCaptured,
        white: currentMove.whiteStonesCaptured
      }
    }

    game.checkTerritory();
    game.renderer.render();
    game.callbacks.postRender(game);
  };

  this.removeScoringState = function() {
    this.deadPoints = [];
    this.territoryPoints = { black: [], white: [] };
  };

  this.checkTerritory = function() {
    var game = this;

    game.territoryPoints = { black: [], white: [] };

    var emptyOrDeadPoints = game.intersections().filter(function(intersection) {
      return intersection.isEmpty() || game.isDeadAt(intersection.y, intersection.x);
    });

    var checkedPoints = [];

    emptyOrDeadPoints.forEach(function(emptyPoint) {
      if (checkedPoints.indexOf(emptyPoint) > -1) {
        // skip it, we already checked
      } else {
        checkedPoints = checkedPoints.concat(game.checkTerritoryStartingAt(emptyPoint.y, emptyPoint.x));
      }
    });
  };

  this.checkTerritoryStartingAt = function(y, x) {
    var game = this;

    var pointsWithBoundary = game.surroundedPointsWithBoundaryAt(y, x);

    var occupiedPoints = pointsWithBoundary.filter(function(checkedPoint) {
      return !game.isDeadAt(checkedPoint.y, checkedPoint.x) && !checkedPoint.isEmpty();
    });

    var nonOccupiedPoints = pointsWithBoundary.filter(function(checkedPoint) {
      return game.isDeadAt(checkedPoint.y, checkedPoint.x) || checkedPoint.isEmpty();
    });

    var surroundingColors = utils.unique(occupiedPoints.map(function(occupiedPoint) { return occupiedPoint.value }));

    if (surroundingColors.length == 1 && surroundingColors[0] != "empty") {
      var territoryColor = surroundingColors[0];

      nonOccupiedPoints.forEach(function(nonOccupiedPoint) {
        game.markTerritory(nonOccupiedPoint.y, nonOccupiedPoint.x, territoryColor);
      });
    }

    return nonOccupiedPoints;
  };

  this.surroundedPointsWithBoundaryAt = function(y, x, accumulated) {
    accumulated || (accumulated = []);

    var game = this;
    var point = game.intersectionAt(y, x);

    if (accumulated.indexOf(point) > -1) {
      return accumulated;
    }

    accumulated.push(point);

    game.neighborsFor(point.y, point.x).forEach(function(neighbor) {
      if (neighbor.isEmpty() || game.isDeadAt(neighbor.y, neighbor.x)) {
        game.surroundedPointsWithBoundaryAt(neighbor.y, neighbor.x, accumulated);
      } else {
        accumulated.push(neighbor);
      }
    });

    return accumulated;
  };

  this.markTerritory = function(y, x, color) {
    var game = this;
    var pointIsMarkedTerritory = game.territoryPoints[color].some(function(point) { return point.y == y && point.x == x; });

    if (!pointIsMarkedTerritory) {
      game.territoryPoints[color].push({ y: y, x: x });
    }
  };

  this.undo = function() {
    var game = this;

    game.moves.pop();
    game.render();
  };
};

module.exports = Game;
