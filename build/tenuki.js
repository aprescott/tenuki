/*!
 * tenuki v0.0.8 (https://github.com/aprescott/tenuki.js)
 * Copyright © 2016 Adam Prescott.
 * Licensed under the MIT license.
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.tenuki = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
exports.Board = require("./lib/board");
exports.utils = require("./lib/utils");

},{"./lib/board":3,"./lib/utils":7}],2:[function(require,module,exports){
var utils = require("./utils");

var BoardRenderer = function(board, boardElement) {
  this.INTERSECTION_GAP_SIZE = 28;
  this.GUTTER_MARGIN = this.INTERSECTION_GAP_SIZE - 3;
  this.BASE_MARGIN = this.INTERSECTION_GAP_SIZE - 10;
  this.MARGIN = boardElement.hasAttribute("data-include-gutter") ? this.BASE_MARGIN + this.GUTTER_MARGIN : this.BASE_MARGIN;
  this.board = board;
  this.boardElement = boardElement;
  this.grid = [];

  this.setup = function() {
    var renderer = this;
    var board = renderer.board;

    utils.appendElement(boardElement, utils.createElement("div", { class: "lines horizontal" }));
    utils.appendElement(boardElement, utils.createElement("div", { class: "lines vertical" }));
    utils.appendElement(boardElement, utils.createElement("div", { class: "hoshi-points" }));
    utils.appendElement(boardElement, utils.createElement("div", { class: "intersections" }));

    if (board.size < 7) {
      if (board.size > 1 && board.size % 2 == 1) {
        var hoshi = utils.createElement("div", { class: "hoshi" });
        hoshi.style.top = "calc(" + (renderer.MARGIN) + "px + " + (board.size - 1)/2 + "* " + (renderer.INTERSECTION_GAP_SIZE + 1) + "px - 2px)";
        hoshi.style.left = hoshi.style.top;

        utils.appendElement(boardElement.querySelector(".hoshi-points"), hoshi);
      } else {
        // no hoshi
      }
    } else {
      var hoshiOffset = board.size > 11 ? 3 : 2;

      for (var hoshiY = 0; hoshiY < 3; hoshiY++) {
        for (var hoshiX = 0; hoshiX < 3; hoshiX++) {
          if ((board.size == 7 || board.size % 2 == 0) && (hoshiY == 1 || hoshiX == 1)) {
            continue;
          }

          var hoshi = utils.createElement("div", { class: "hoshi" });

          if (hoshiY == 0) {
            hoshi.style.top = "calc(" + (renderer.MARGIN) + "px + " + hoshiOffset + "* " + (renderer.INTERSECTION_GAP_SIZE + 1) + "px - 2px)";
          }

          if (hoshiY == 1) {
            hoshi.style.top = "calc(" + (renderer.MARGIN) + "px + " + ((board.size + 1)/2 - 1) + "* " + (renderer.INTERSECTION_GAP_SIZE + 1) + "px - 2px)";
          }

          if (hoshiY == 2) {
            hoshi.style.top = "calc(" + (renderer.MARGIN) + "px + " + (board.size - hoshiOffset - 1) + "* " + (renderer.INTERSECTION_GAP_SIZE + 1) + "px - 2px)";
          }

          if (hoshiX == 0) {
            hoshi.style.left = "calc(" + (renderer.MARGIN) + "px + " + hoshiOffset + "* " + (renderer.INTERSECTION_GAP_SIZE + 1) + "px - 2px)";
          }

          if (hoshiX == 1) {
            hoshi.style.left = "calc(" + (renderer.MARGIN) + "px + " + ((board.size + 1)/2 - 1) + "* " + (renderer.INTERSECTION_GAP_SIZE + 1) + "px - 2px)";
          }

          if (hoshiX == 2) {
            hoshi.style.left = "calc(" + (renderer.MARGIN) + "px + " + (board.size - hoshiOffset - 1) + "* " + (renderer.INTERSECTION_GAP_SIZE + 1) + "px - 2px)";
          }

          utils.appendElement(boardElement.querySelector(".hoshi-points"), hoshi);
        }
      }
    }

    for (var y = 0; y < board.size; y++) {
      var horizontalLine = utils.createElement("div", { class: "line horizontal" });
      horizontalLine.setAttribute("data-left-gutter", board.yCoordinateFor(y));
      utils.appendElement(boardElement.querySelector(".lines.horizontal"), horizontalLine);

      var verticalLine = utils.createElement("div", { class: "line vertical" });
      verticalLine.setAttribute("data-top-gutter", board.xCoordinateFor(y))
      utils.appendElement(boardElement.querySelector(".lines.vertical"), verticalLine);

      for (var x = 0; x < board.size; x++) {
        var intersectionElement = utils.createElement("div", { class: "intersection empty" });
        var highlightElement = utils.createElement("div", { class: "highlight" });
        utils.appendElement(intersectionElement, highlightElement);

        intersectionElement.setAttribute("data-position-x", x);
        intersectionElement.setAttribute("data-position-y", y);
        intersectionElement.board = board;

        intersectionElement.style.left = (x * (renderer.INTERSECTION_GAP_SIZE + 1)) + "px";
        intersectionElement.style.top = (y * (renderer.INTERSECTION_GAP_SIZE + 1)) + "px";

        utils.appendElement(boardElement.querySelector(".intersections"), intersectionElement);

        renderer.grid[y] || (renderer.grid[y] = []);
        renderer.grid[y][x] = intersectionElement;
      }
    }

    // prevent the text-selection cursor
    utils.addEventListener(boardElement.querySelector(".lines.horizontal"), "mousedown", function(e) {
      e.preventDefault();
    });
    utils.addEventListener(boardElement.querySelector(".lines.vertical"), "mousedown", function(e) {
      e.preventDefault();
    });

    boardElement.querySelector(".lines.horizontal").style.width = ((renderer.INTERSECTION_GAP_SIZE * (board.size - 1)) + (board.size)*1) + "px";
    boardElement.querySelector(".lines.horizontal").style.height = ((renderer.INTERSECTION_GAP_SIZE * (board.size - 1)) + (board.size)*1) + "px";
    boardElement.querySelector(".lines.vertical").style.width = ((renderer.INTERSECTION_GAP_SIZE * (board.size - 1)) + (board.size)*1) + "px";
    boardElement.querySelector(".lines.vertical").style.height = ((renderer.INTERSECTION_GAP_SIZE * (board.size - 1)) + (board.size)*1) + "px";

    var boardWidth = ((renderer.INTERSECTION_GAP_SIZE * (board.size - 1)) + (board.size)*1 + (renderer.MARGIN)*2);
    var boardHeight = ((renderer.INTERSECTION_GAP_SIZE * (board.size - 1)) + (board.size)*1 + (renderer.MARGIN)*2);

    boardElement.style.width = boardWidth + "px";
    boardElement.style.height = boardHeight + "px";

    utils.flatten(renderer.grid).forEach(function(intersectionEl) {
      utils.addEventListener(intersectionEl, "click", function() {
        var intersectionElement = this;
        var playedYPosition = Number(intersectionElement.getAttribute("data-position-y"));
        var playedXPosition = Number(intersectionElement.getAttribute("data-position-x"));

        if (board.isGameOver()) {
          board.toggleDeadAt(playedYPosition, playedXPosition);
        } else {
          board.playAt(playedYPosition, playedXPosition);
        }
      });
    });
  }

  this.render = function() {
    this.renderStonesPlayed();
    this.updateMarkerPoints();
    this.updateCurrentPlayer();

    if (this.board.isGameOver()) {
      this.renderTerritory();
    }
  }

  this.renderStonesPlayed = function() {
    var renderer = this;
    var board = renderer.board;
    var currentMove = board.currentMove();
    var points = currentMove ? currentMove.points : board.intersections();

    points.forEach(function(intersection) {
      renderer.renderIntersection(intersection);
    });
  };

  this.updateMarkerPoints = function() {
    var renderer = this;
    var board = this.board;
    var currentMove = board.currentMove();

    if (!currentMove) {
      return;
    }

    board.intersections().forEach(function(intersection) {
      if (board.wouldBeSuicide(intersection.y, intersection.x)) {
        utils.addClass(renderer.grid[intersection.y][intersection.x], "suicide");
      }
    });

    if (currentMove.koPoint) {
      utils.addClass(renderer.grid[currentMove.koPoint.y][currentMove.koPoint.x], "ko");
    }

    if (!currentMove.pass) {
      utils.addClass(renderer.grid[currentMove.y][currentMove.x], "marker");
    }
  };

  this.updateCurrentPlayer = function() {
    var board = this.board;
    var previousPlayer = (board.currentPlayer == "black" ? "white" : "black");
    utils.removeClass(boardElement, previousPlayer + "-to-play");
    utils.addClass(boardElement, board.currentPlayer + "-to-play");

    if (board.isGameOver()) {
      utils.removeClass(boardElement, "black-to-play");
      utils.removeClass(boardElement, "white-to-play");
    }
  };

  this.renderIntersection = function(intersection) {
    var renderer = this;
    var board = this.board;

    var intersectionEl = renderer.grid[intersection.y][intersection.x];
    intersectionEl.className = ""; // be clear that we're removing all classes
    utils.addClass(intersectionEl, "intersection");

    if (intersection.isEmpty()) {
      utils.addClass(intersectionEl, "empty");
    } else {
      utils.addClass(intersectionEl, "stone");

      if (intersection.isBlack()) {
        utils.addClass(intersectionEl, "black");
      } else {
        utils.addClass(intersectionEl, "white");
      }
    }
  };

  this.renderTerritory = function() {
    var renderer = this;
    var board = this.board;

    board.intersections().forEach(function(intersection) {
      utils.removeClass(renderer.grid[intersection.y][intersection.x], "territory-black");
      utils.removeClass(renderer.grid[intersection.y][intersection.x], "territory-white");

      if (board.isDeadAt(intersection.y, intersection.x)) {
        utils.addClass(renderer.grid[intersection.y][intersection.x], "dead");
      } else {
        utils.removeClass(renderer.grid[intersection.y][intersection.x], "dead");
      }
    });

    board.territoryPoints.black.forEach(function(territoryPoint) {
      utils.addClass(renderer.grid[territoryPoint.y][territoryPoint.x], "territory-black");
    });

    board.territoryPoints.white.forEach(function(territoryPoint) {
      utils.addClass(renderer.grid[territoryPoint.y][territoryPoint.x], "territory-white");
    });
  };
};

module.exports = BoardRenderer;

},{"./utils":7}],3:[function(require,module,exports){
var utils = require("./utils");
var BoardRenderer = require("./board-renderer");
var NullRenderer = require("./null-renderer");
var Intersection = require("./intersection");
var Scorer = require("./scorer");

var Board = function(element, size) {
  this.defaultSize = 19;
  this.size = size || this.defaultSize;
  this.intersectionGrid = [];
  this.currentPlayer = "black";
  this.moves = [];
  this.captures = {
    black: 0,
    white: 0
  };
  this.renderer = (element ? new BoardRenderer(this, element) : new NullRenderer());
  this.callbacks = {
    postRender: function() {}
  };
  this.deadPoints = [];
  this.territoryPoints = { black: [], white: [] };

  this.setup = function() {
    var board = this;

    if (board.size > 19) {
      throw "cannot generate a board size greater than 19";
    }

    board.renderer.setup();

    for (var y = 0; y < board.size; y++) {
      for (var x = 0; x < board.size; x++) {
        var intersection = new Intersection(y, x, board);
        board.intersectionGrid[y] || (board.intersectionGrid[y] = []);
        board.intersectionGrid[y][x] = intersection;
      }
    }

    board.render();
  };

  this.intersectionAt = function(y, x) {
    return this.intersectionGrid[y][x];
  };

  this.intersections = function() {
    return utils.flatten(this.intersectionGrid);
  };

  this.yCoordinateFor = function(y) {
    return board.size - y;
  };

  this.xCoordinateFor = function(x) {
    letters = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"];

    return letters[x];
  };

  this.stateFor = function(y, x, captures) {
    var board = this;

    var moveInfo = {
      y: y,
      x: x,
      coordinates: this.xCoordinateFor(x) + this.yCoordinateFor(y),
      color: board.currentPlayer,
      pass: false,
      points: board.intersections().map(function(i) { return i.duplicate(); }),
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
      color: board.currentPlayer,
      pass: true,
      points: board.intersections().map(function(i) { return i.duplicate(); }),
      blackStonesCaptured: board.captures.black,
      whiteStonesCaptured: board.captures.white,
      capturedPositions: []
    };
  };

  this.playAt = function(y, x) {
    var board = this;

    if (board.isIllegalAt(y, x)) {
      return false;
    }

    board[board.currentPlayer + "At"](y, x);

    var captures = board.clearCapturesFor(y, x);

    board.moves.push(board.stateFor(y, x, captures));
    board.render();

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
    var board = this;
    var intersection = board.intersectionAt(y, x);
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
    var board = this;

    return board.deadPoints.some(function(dead) {
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
    var board = this;
    var point = board.intersectionAt(y, x);

    return captures.length == 1 && this.groupAt(point.y, point.x).length == 1 && board.inAtari(point.y, point.x);
  };

  this.libertiesAt = function(y, x) {
    var board = this;
    var point = board.intersectionAt(y, x);

    var emptyPoints = utils.flatMap(this.groupAt(point.y, point.x), function(groupPoint) {
      return board.neighborsFor(groupPoint.y, groupPoint.x).filter(function(intersection) {
        return intersection.isEmpty();
      })
    });

    // this is not great, but we need a representation that will be unique-able,
    // and Y-X does the job.
    return utils.unique(emptyPoints.map(function(emptyPoint) { return emptyPoint.y + "-" + emptyPoint.x; })).length;
  };

  this.groupAt = function(y, x, accumulated) {
    accumulated || (accumulated = []);

    var board = this;
    var point = board.intersectionAt(y, x);

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
      neighbors.push(this.intersectionAt(y, x - 1));
    }

    if (x < (this.size - 1)) {
      neighbors.push(this.intersectionAt(y, x + 1));
    }

    if (y > 0) {
      neighbors.push(this.intersectionAt(y - 1, x));
    }

    if (y < (this.size - 1)) {
      neighbors.push(this.intersectionAt(y + 1, x));
    }

    return neighbors;
  };

  this.hasCapturesFor = function(y, x) {
    var board = this;
    var point = board.intersectionAt(y, x);

    var capturedNeighbors = board.neighborsFor(point.y, point.x).filter(function(neighbor) {
      return !neighbor.isEmpty && !neighbor.sameColorAs(point) && board.libertiesAt(neighbor.y, neighbor.x) == 0;
    });

    return capturedNeighbors.length > 0
  };

  this.clearCapturesFor = function(y, x) {
    var board = this;
    var point = board.intersectionAt(y, x);

    var capturedNeighbors = board.neighborsFor(point.y, point.x).filter(function(neighbor) {
      return !neighbor.isEmpty() && !neighbor.sameColorAs(point) && board.libertiesAt(neighbor.y, neighbor.x) == 0;
    });

    var capturedStones = utils.flatMap(capturedNeighbors, function(neighbor) {
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
    var intersection = board.intersectionAt(y, x);

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

    board.intersections().forEach(function(intersection) {
      if (!currentMove) {
        intersection.setEmpty();
      }

      board.intersectionGrid[intersection.y][intersection.x] = intersection.duplicate();
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

    var emptyOrDeadPoints = board.intersections().filter(function(intersection) {
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

    var surroundingColors = utils.unique(occupiedPoints.map(function(occupiedPoint) { return occupiedPoint.value }));

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
    var point = board.intersectionAt(y, x);

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

module.exports = Board;

},{"./board-renderer":2,"./intersection":4,"./null-renderer":5,"./scorer":6,"./utils":7}],4:[function(require,module,exports){
var Intersection = function(y, x, board) {
  this.y = y;
  this.x = x;
  this.value = "empty";
  this.board = board;

  this.duplicate = function() {
    var duplicateIntersection = new Intersection(this.y, this.x, this.board);
    duplicateIntersection.value = this.value;

    return duplicateIntersection;
  }

  this.setWhite = function() {
    this.value = "white";
  };

  this.isOccupiedWith = function(color) {
    if (this.isEmpty()) {
      return false;
    }

    return this.value === color;
  };

  this.setBlack = function() {
    this.value = "black";
  };

  this.isBlack = function() {
    return this.value === "black";
  };

  this.isWhite = function() {
    return this.value === "white";
  }

  this.setEmpty = function() {
    this.value = "empty";
  };

  this.isEmpty = function() {
    return this.value === "empty";
  };

  this.sameColorAs = function(otherIntersection) {
    return this.value === otherIntersection.value;
  };
};

module.exports = Intersection;

},{}],5:[function(require,module,exports){
var NullRenderer = function() {
  this.setup = function() {};
  this.render = function() {};
}

module.exports = NullRenderer;

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
var utils = {
  flatten: function(ary) {
    return ary.reduce(function(a, b) { return a.concat(b); })
  },

  flatMap: function(ary, lambda) {
    return Array.prototype.concat.apply([], ary.map(lambda));
  },

  createElement: function(elementName, options) {
    element = document.createElement(elementName);

    if (typeof options != "undefined") {
      if (options.class) {
        element.className = options.class;
      }
    }

    return element;
  },

  appendElement: function(parent, el) {
    parent.insertBefore(el, null);
  },

  addEventListener: function(el, eventName, fn) {
    el.addEventListener(eventName, fn, false);
  },

  removeClass: function(el, className) {
    el.classList.remove(className);
  },

  addClass: function(el, className) {
    el.classList.add(className);
  },

  hasClass: function(el, className) {
    return el.classList.contains(className);
  },

  toggleClass: function(el, className) {
    if (this.hasClass(el, className)) {
      this.removeClass(el, className);
    } else {
      this.addClass(el, className);
    }
  },

  unique: function(ary) {
    return Array.from(new Set(ary));
  }
};

module.exports = utils;

},{}]},{},[1])(1)
});