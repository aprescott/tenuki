tenuki.Board = function(element, size) {
  this.defaultSize = 19;
  this.size = size || this.defaultSize;
  this.intersections = [];
  this.currentPlayer = "black";
  this.moves = [];
  this.captures = {
    black: 0,
    white: 0
  };
  this.renderer = new tenuki.BoardRenderer(this, element);
  this.callbacks = {
    postRender: function() {}
  };
  this.deadPoints = [];
  this.territoryPoints = { black: [], white: [] };

  this.setup = function() {
    var board = this;

    board.renderer.setup();

    for (var y = 0; y < board.size; y++) {
      for (var x = 0; x < board.size; x++) {
        var intersection = new tenuki.Intersection(y, x, board);
        board.intersections[y] || (board.intersections[y] = []);
        board.intersections[y][x] = intersection;
      }
    }

    board.render();
  };

  this.stateFor = function(y, x, captures) {
    var board = this;

    var moveInfo = {
      y: y,
      x: x,
      color: board.currentPlayer,
      pass: false,
      points: board.intersections.flatten().map(function(i) { return i.duplicate(); }),
      blackStonesCaptured: board.captures.black,
      whiteStonesCaptured: board.captures.white,
      capturedPositions: captures.map(function(capturedStone) {
        return { y: capturedStone.y, x: capturedStone.x, color: (board.isBlackPlaying() ? "white" : "black") }
      })
    };

    if (board.isKoFrom(y, x, captures)) {
      moveInfo["koPoint"] = { y: captures[0].y, x: captures[0].x };
    } else {
      moveInfo["koPoint"] = null;
    }

    return moveInfo;
  };

  this.whiteAt = function(y, x) {
    this.intersections[y][x].setWhite();
  };
  this.blackAt = function(y, x) {
    this.intersections[y][x].setBlack();
  };
  this.removeAt = function(y, x) {
    this.intersections[y][x].setEmpty();
  };

  this.stateForPass = function() {
    return {
      y: null,
      x: null,
      color: board.currentPlayer,
      pass: true,
      points: board.intersections.flatten().map(function(i) { return i.duplicate(); }),
      blackStonesCaptured: board.captures.black,
      whiteStonesCaptured: board.captures.white,
      capturedPositions: []
    };
  };

  this.playAt = function(y, x) {
    var board = this;

    if (board.isIllegalAt(y, x)) {
      return true;
    }

    board[board.currentPlayer + "At"](y, x);

    var captures = board.clearCapturesFor(y, x);

    board.moves.push(board.stateFor(y, x, captures));
    board.render();
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
    var board = this;
    var intersection = board.intersections[y][x];
    var surroundedEmptyPoint = intersection.isEmpty() && board.neighborsFor(intersection.y, intersection.x).filter(function(neighbor) { return neighbor.isEmpty() }).length == 0;

    if (!surroundedEmptyPoint) {
      return false;
    }

    suicide = true;

    var friendlyNeighbors = board.neighborsFor(intersection.y, intersection.x).filter(function(neighbor) {
      return neighbor.isOccupiedWith(board.currentPlayer);
    });

    var someFriendlyNotInAtari = board.neighborsFor(intersection.y, intersection.x).some(function(neighbor) {
      var inAtari = board.inAtari(neighbor.y, neighbor.x);
      var friendly = neighbor.isOccupiedWith(board.currentPlayer);

      return friendly && !inAtari;
    });

    if (someFriendlyNotInAtari) {
      suicide = false;
    }

    var someEnemyInAtari = board.neighborsFor(intersection.y, intersection.x).some(function(neighbor) {
      var inAtari = board.inAtari(neighbor.y, neighbor.x);
      var enemy = !neighbor.isOccupiedWith(board.currentPlayer);

      return enemy && inAtari;
    });

    if (someEnemyInAtari) {
      suicide = false;
    }

    return suicide;
  };

  this.pass = function() {
    if (!this.isGameOver()) {
      this.moves.push(this.stateForPass())
      this.render();
    }
  };

  this.isGameOver = function() {
    if (this.moves.length < 2) {
      return false;
    }

    var currentMove = this.currentMove();
    var previousMove = this.moves[this.moves.length - 2];

    return currentMove.pass && previousMove.pass;
  };

  this.toggleDeadAt = function(y, x) {
    var board = this;

    var alreadyDead = board.isDeadAt(y, x);

    board.groupAt(y, x).forEach(function(intersection) {
      if (alreadyDead) {
        board.deadPoints = board.deadPoints.filter(function(dead) { return !(dead.y == intersection.y && dead.x == intersection.x) });
      } else {
        board.deadPoints.push({ y: intersection.y, x: intersection.x });
      }
    });

    board.render();
  }

  this.isDeadAt = function(y, x) {
    return board.deadPoints.some(function(dead) {
      return dead.y == y && dead.x == x;
    });
  };

  this.score = function() {
    var blackDeadAsCaptures = this.deadPoints.filter(function(deadPoint) { return board.intersections[deadPoint.y][deadPoint.x].isBlack(); });
    var whiteDeadAsCaptures = this.deadPoints.filter(function(deadPoint) { return board.intersections[deadPoint.y][deadPoint.x].isWhite(); });

    return {
      black: this.territoryPoints.black.length + this.captures.white + whiteDeadAsCaptures.length,
      white: this.territoryPoints.white.length + this.captures.black + blackDeadAsCaptures.length
    };
  }

  this.isKoFrom = function(y, x, captures) {
    var board = this;
    var point = board.intersections[y][x];

    return captures.length == 1 && this.groupAt(point.y, point.x).length == 1 && board.inAtari(point.y, point.x);
  };

  this.libertiesAt = function(y, x) {
    var board = this;
    var point = board.intersections[y][x];

    var emptyPoints = this.groupAt(point.y, point.x).flatMap(function(groupPoint) {
      return board.neighborsFor(groupPoint.y, groupPoint.x).filter(function(intersection) {
        return intersection.isEmpty();
      })
    });

    // this is not great, but we need a representation that will be unique-able,
    // and Y-X does the job.
    return tenuki.utils.unique(emptyPoints.map(function(emptyPoint) { return emptyPoint.y + "-" + emptyPoint.x; })).length;
  };

  this.groupAt = function(y, x, accumulated) {
    accumulated || (accumulated = []);

    var board = this;
    var point = board.intersections[y][x];

    if (accumulated.indexOf(point) > -1) {
      return accumulated
    }

    accumulated.push(point);

    board.neighborsFor(point.y, point.x).filter(function(neighbor) {
      return !neighbor.isEmpty();
    }).forEach(function(neighbor) {
      if (neighbor.sameColorAs(point)) {
        board.groupAt(neighbor.y, neighbor.x, accumulated);
      }
    });

    return accumulated;
  };

  this.neighborsFor = function(y, x) {
    var neighbors = [];

    if (x > 0) {
      neighbors.push(this.intersections[y][x - 1]);
    }

    if (x < (this.size - 1)) {
      neighbors.push(this.intersections[y][x + 1]);
    }

    if (y > 0) {
      neighbors.push(this.intersections[y - 1][x]);
    }

    if (y < (this.size - 1)) {
      neighbors.push(this.intersections[y + 1][x]);
    }

    return neighbors;
  };

  this.hasCapturesFor = function(y, x) {
    var board = this;
    var point = board.intersections[y][x];

    var capturedNeighbors = board.neighborsFor(point.y, point.x).filter(function(neighbor) {
      return !neighbor.isEmpty && !neighbor.sameColorAs(point) && board.libertiesAt(neighbor.y, neighbor.x) == 0;
    });

    return capturedNeighbors.length > 0
  };

  this.clearCapturesFor = function(y, x) {
    var board = this;
    var point = board.intersections[y][x];

    var capturedNeighbors = board.neighborsFor(point.y, point.x).filter(function(neighbor) {
      return !neighbor.isEmpty() && !neighbor.sameColorAs(point) && board.libertiesAt(neighbor.y, neighbor.x) == 0;
    });

    var capturedStones = capturedNeighbors.flatMap(function(neighbor) {
      return board.groupAt(neighbor.y, neighbor.x);
    });

    capturedStones.forEach(function(capturedStone) {
      if (capturedStone.isBlack()) {
        board.captures["black"] += 1;
      } else {
        board.captures["white"] += 1;
      }

      board.removeAt(capturedStone.y, capturedStone.x);
    });

    return capturedStones;
  };

  this.isIllegalAt = function(y, x) {
    if (this.moves.length == 0) {
      return false;
    }

    var board = this;
    var intersection = board.intersections[y][x];

    var isEmpty = intersection.isEmpty();
    var isCapturing = this.hasCapturesFor(y, x);
    var isSuicide = this.wouldBeSuicide(y, x);
    var koPoint = this.currentMove().koPoint;
    var isKoViolation = koPoint && koPoint.y == y && koPoint.x == x;

    return !isEmpty || isKoViolation || (isSuicide && !isCapturing);
  };

  this.render = function() {
    var board = this;
    var currentMove = board.currentMove();

    if (!board.isGameOver()) {
      board.removeScoringState();
    }

    board.intersections.flatten().forEach(function(intersection) {
      if (!currentMove) {
        intersection.setEmpty();
      }

      board.intersections[intersection.y][intersection.x] = intersection.duplicate();
    });

    if (!currentMove) {
      board.currentPlayer = "black";
      board.captures = { black: 0, white: 0 };
    } else {
      if (currentMove.color == "black") {
        board.currentPlayer = "white";
      } else {
        board.currentPlayer = "black";
      }

      board.captures = {
        black: currentMove.blackStonesCaptured,
        white: currentMove.whiteStonesCaptured
      }
    }

    board.checkTerritory();
    board.renderer.render();
    board.callbacks.postRender(board);
  };

  this.removeScoringState = function() {
    this.deadPoints = [];
    this.territoryPoints = { black: [], white: [] };
  };

  this.checkTerritory = function() {
    var board = this;

    board.territoryPoints = { black: [], white: [] };

    var emptyOrDeadPoints = board.intersections.flatten().filter(function(intersection) {
      return intersection.isEmpty() || board.isDeadAt(intersection.y, intersection.x);
    });

    var checkedPoints = [];

    emptyOrDeadPoints.forEach(function(emptyPoint) {
      if (checkedPoints.indexOf(emptyPoint) > -1) {
        // skip it, we already checked
      } else {
        checkedPoints = checkedPoints.concat(board.checkTerritoryStartingAt(emptyPoint.y, emptyPoint.x));
      }
    });
  };

  this.checkTerritoryStartingAt = function(y, x) {
    var board = this;

    var pointsWithBoundary = board.surroundedPointsWithBoundaryAt(y, x);

    var occupiedPoints = pointsWithBoundary.filter(function(checkedPoint) {
      return !board.isDeadAt(checkedPoint.y, checkedPoint.x) && !checkedPoint.isEmpty();
    });

    var nonOccupiedPoints = pointsWithBoundary.filter(function(checkedPoint) {
      return board.isDeadAt(checkedPoint.y, checkedPoint.x) || checkedPoint.isEmpty();
    });

    var surroundingColors = tenuki.utils.unique(occupiedPoints.map(function(occupiedPoint) { return occupiedPoint.value }));

    if (surroundingColors.length == 1 && surroundingColors[0] != "empty") {
      var territoryColor = surroundingColors[0];

      nonOccupiedPoints.forEach(function(nonOccupiedPoint) {
        board.markTerritory(nonOccupiedPoint.y, nonOccupiedPoint.x, territoryColor);
      });
    }

    return nonOccupiedPoints;
  };

  this.surroundedPointsWithBoundaryAt = function(y, x, accumulated) {
    accumulated || (accumulated = []);

    var board = this;
    var point = board.intersections[y][x];

    if (accumulated.indexOf(point) > -1) {
      return accumulated;
    }

    accumulated.push(point);

    board.neighborsFor(point.y, point.x).forEach(function(neighbor) {
      if (neighbor.isEmpty() || board.isDeadAt(neighbor.y, neighbor.x)) {
        board.surroundedPointsWithBoundaryAt(neighbor.y, neighbor.x, accumulated);
      } else {
        accumulated.push(neighbor);
      }
    });

    return accumulated;
  };

  this.markTerritory = function(y, x, color) {
    var board = this;
    var pointIsMarkedTerritory = board.territoryPoints[color].some(function(point) { return point.y == y && point.x == x; });

    if (!pointIsMarkedTerritory) {
      board.territoryPoints[color].push({ y: y, x: x });
    }
  };

  this.undo = function() {
    var board = this;

    board.moves.pop();
    board.render();
  };
};
