/*!
 * tenuki v0.2.1 (https://github.com/aprescott/tenuki.js)
 * Copyright © 2016 Adam Prescott.
 * Licensed under the MIT license.
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.tenuki = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

exports.Game = require("./lib/game").default;
exports.Client = require("./lib/client").default;
exports.utils = require("./lib/utils").default;

},{"./lib/client":3,"./lib/game":6,"./lib/utils":14}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;_e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }return _arr;
  }return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

var _utils = require("./utils");

var _utils2 = _interopRequireDefault(_utils);

var _intersection = require("./intersection");

var _intersection2 = _interopRequireDefault(_intersection);

var _zobrist = require("./zobrist");

var _zobrist2 = _interopRequireDefault(_zobrist);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var BoardState = function BoardState(_ref) {
  var moveNumber = _ref.moveNumber;
  var playedPoint = _ref.playedPoint;
  var color = _ref.color;
  var pass = _ref.pass;
  var blackPassStones = _ref.blackPassStones;
  var whitePassStones = _ref.whitePassStones;
  var intersections = _ref.intersections;
  var blackStonesCaptured = _ref.blackStonesCaptured;
  var whiteStonesCaptured = _ref.whiteStonesCaptured;
  var capturedPositions = _ref.capturedPositions;
  var koPoint = _ref.koPoint;
  var boardSize = _ref.boardSize;

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
  this._positionHash = _zobrist2.default.hash(boardSize, intersections);

  Object.freeze(this);
};

BoardState.prototype = {
  _capturesFrom: function _capturesFrom(y, x, color) {
    var _this = this;

    var capturedNeighbors = this.neighborsFor(y, x).filter(function (neighbor) {
      // TODO: this value of 1 is potentially weird.
      // we're checking against the move before the stone we just played
      // where this space is not occupied yet. things should possibly be
      // reworked.
      return !neighbor.isEmpty() && neighbor.value !== color && _this.libertiesAt(neighbor.y, neighbor.x) === 1;
    });

    var capturedStones = _utils2.default.flatMap(capturedNeighbors, function (neighbor) {
      return _this.groupAt(neighbor.y, neighbor.x);
    });

    return _utils2.default.unique(capturedStones);
  },

  _updateIntersection: function _updateIntersection(intersection, intersections, color) {
    return intersections.map(function (i) {
      if (i.y === intersection.y && i.x === intersection.x) {
        return new _intersection2.default(i.y, i.x, color);
      } else {
        return i;
      }
    });
  },

  _removeIntersection: function _removeIntersection(intersection, intersections) {
    return this._updateIntersection(intersection, intersections, "empty");
  },

  _withoutIntersectionsMatching: function _withoutIntersectionsMatching(condition) {
    var newPoints = this.intersections.map(function (i) {
      if (condition(i)) {
        return new _intersection2.default(i.y, i.x, "empty");
      } else {
        return i;
      }
    });

    return this._withNewPoints(newPoints);
  },

  _withNewPoints: function _withNewPoints(newPoints) {
    var newState = new BoardState({
      moveNumber: this.moveNumber,
      playedPoint: this.playedPoint,
      color: this.color,
      pass: this.pass,
      blackPassStones: this.blackPassStones,
      whitePassStones: this.whitePassStones,
      intersections: newPoints,
      blackStonesCaptured: this.blackStonesCaptured,
      whiteStonesCaptured: this.whiteStonesCaptured,
      capturedPositions: this.capturedPositions,
      koPoint: this.koPoint,
      boardSize: this.boardSize
    });

    return newState;
  },

  yCoordinateFor: function yCoordinateFor(y) {
    return this.boardSize - y;
  },

  xCoordinateFor: function xCoordinateFor(x) {
    var letters = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"];

    return letters[x];
  },

  playPass: function playPass(color) {
    var stateInfo = {
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

    var newState = new BoardState(stateInfo);

    return newState;
  },

  playAt: function playAt(y, x, playedColor) {
    var _this2 = this;

    var capturedPositions = this._capturesFrom(y, x, playedColor);
    var playedPoint = this.intersectionAt(y, x);
    var newPoints = this.intersections;

    capturedPositions.forEach(function (i) {
      newPoints = _this2._removeIntersection(i, newPoints);
    });

    newPoints = this._updateIntersection(playedPoint, newPoints, playedColor);

    var newTotalBlackCaptured = this.blackStonesCaptured + (playedColor === "black" ? 0 : capturedPositions.length);
    var newTotalWhiteCaptured = this.whiteStonesCaptured + (playedColor === "white" ? 0 : capturedPositions.length);

    var boardSize = this.boardSize;

    var moveInfo = {
      moveNumber: this.moveNumber + 1,
      playedPoint: playedPoint,
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

    var withPlayedPoint = new BoardState(moveInfo);
    var hasKoPoint = capturedPositions.length === 1 && withPlayedPoint.groupAt(y, x).length === 1 && withPlayedPoint.inAtari(y, x);

    if (hasKoPoint) {
      moveInfo["koPoint"] = { y: capturedPositions[0].y, x: capturedPositions[0].x };
    } else {
      moveInfo["koPoint"] = null;
    }

    return new BoardState(moveInfo);
  },

  intersectionAt: function intersectionAt(y, x) {
    return this.intersections[y * this.boardSize + x];
  },

  groupAt: function groupAt(y, x) {
    var startingPoint = this.intersectionAt(y, x);

    var _partitionTraverse = this.partitionTraverse(startingPoint, function (neighbor) {
      return neighbor.sameColorAs(startingPoint);
    });

    var _partitionTraverse2 = _slicedToArray(_partitionTraverse, 2);

    var group = _partitionTraverse2[0];
    var _ = _partitionTraverse2[1];

    return group;
  },

  libertiesAt: function libertiesAt(y, x) {
    var _this3 = this;

    var point = this.intersectionAt(y, x);

    var emptyPoints = _utils2.default.flatMap(this.groupAt(point.y, point.x), function (groupPoint) {
      return _this3.neighborsFor(groupPoint.y, groupPoint.x).filter(function (intersection) {
        return intersection.isEmpty();
      });
    });

    return _utils2.default.unique(emptyPoints).length;
  },

  inAtari: function inAtari(y, x) {
    return this.libertiesAt(y, x) === 1;
  },

  neighborsFor: function neighborsFor(y, x) {
    var neighbors = [];

    if (x > 0) {
      neighbors.push(this.intersectionAt(y, x - 1));
    }

    if (x < this.boardSize - 1) {
      neighbors.push(this.intersectionAt(y, x + 1));
    }

    if (y > 0) {
      neighbors.push(this.intersectionAt(y - 1, x));
    }

    if (y < this.boardSize - 1) {
      neighbors.push(this.intersectionAt(y + 1, x));
    }

    return neighbors;
  },

  positionSameAs: function positionSameAs(otherState) {
    return this._positionHash === otherState._positionHash && this.intersections.every(function (point) {
      return point.sameColorAs(otherState.intersectionAt(point.y, point.x));
    });
  },

  // Iterative depth-first search traversal. Start from
  // startingPoint, iteratively follow all neighbors.
  // If inclusionConditionis met for a neighbor, include it
  // otherwise, exclude it. At the end, return two arrays:
  // One for the included neighbors, another for the remaining neighbors.
  partitionTraverse: function partitionTraverse(startingPoint, inclusionCondition) {
    var checkedPoints = [];
    var boundaryPoints = [];
    var pointsToCheck = [];

    pointsToCheck.push(startingPoint);

    while (pointsToCheck.length > 0) {
      var point = pointsToCheck.pop();

      if (checkedPoints.indexOf(point) > -1) {
        // skip it, we already checked
      } else {
          checkedPoints.push(point);

          this.neighborsFor(point.y, point.x).forEach(function (neighbor) {
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

    return [checkedPoints, _utils2.default.unique(boundaryPoints)];
  }
};

BoardState._initialFor = function (boardSize, handicapStones) {
  this._cache = this._cache || {};
  this._cache[boardSize] = this._cache[boardSize] || {};

  if (this._cache[boardSize][handicapStones]) {
    return this._cache[boardSize][handicapStones];
  }

  var emptyPoints = Array.apply(null, Array(boardSize * boardSize));
  emptyPoints = emptyPoints.map(function (x, i) {
    return new _intersection2.default(Math.floor(i / boardSize), i % boardSize);
  });

  var hoshiOffset = boardSize > 11 ? 3 : 2;
  var hoshiPoints = {
    topRight: { y: hoshiOffset, x: boardSize - hoshiOffset - 1 },
    bottomLeft: { y: boardSize - hoshiOffset - 1, x: hoshiOffset },
    bottomRight: { y: boardSize - hoshiOffset - 1, x: boardSize - hoshiOffset - 1 },
    topLeft: { y: hoshiOffset, x: hoshiOffset },
    middle: { y: (boardSize + 1) / 2 - 1, x: (boardSize + 1) / 2 - 1 },
    middleLeft: { y: (boardSize + 1) / 2 - 1, x: hoshiOffset },
    middleRight: { y: (boardSize + 1) / 2 - 1, x: boardSize - hoshiOffset - 1 },
    middleTop: { y: hoshiOffset, x: (boardSize + 1) / 2 - 1 },
    middleBottom: { y: boardSize - hoshiOffset - 1, x: (boardSize + 1) / 2 - 1 }
  };
  var handicapPlacements = {
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

  handicapPlacements[handicapStones].forEach(function (p) {
    emptyPoints[p.y * boardSize + p.x] = new _intersection2.default(p.y, p.x, "black");
  });

  var initialState = new BoardState({
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

exports.default = BoardState;


},{"./intersection":7,"./utils":14,"./zobrist":15}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _game = require("./game");

var _game2 = _interopRequireDefault(_game);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var Client = function Client(boardElement) {
  this._boardElement = boardElement;
};

Client.prototype = {
  setup: function setup(_ref) {
    var _this = this;

    var player = _ref.player;
    var gameOptions = _ref.gameOptions;
    var hooks = _ref.hooks;

    this._player = player;
    this._hooks = hooks;

    if (this._player !== "black" && this._player !== "white") {
      throw new Error("Player must be either black or white, but was given: " + this._player);
    }

    gameOptions["_hooks"] = {
      handleClick: function handleClick(y, x) {
        if (_this._busy) {
          return;
        }

        _this._busy = true;

        if (_this.isOver()) {
          var stonesToBeMarkedDead = _this._game.currentState().groupAt(y, x).map(function (i) {
            return {
              y: i.y,
              x: i.x,
              color: i.color
            };
          });

          _this._hooks.submitMarkDeadAt(y, x, stonesToBeMarkedDead, function (result) {
            if (result) {
              _this._game.toggleDeadAt(y, x);
            }

            _this._busy = false;
          });
        } else {
          if (_this._player !== _this.currentPlayer()) {
            _this._busy = false;

            return;
          }

          _this._hooks.submitPlay(y, x, function (result) {
            if (result) {
              _this._game.playAt(y, x, _this._player);
            }

            _this._busy = false;
          });
        }
      },

      hoverValue: function hoverValue(y, x) {
        if (!_this._busy && _this._player === _this.currentPlayer() && !_this.isOver() && !_this._game.isIllegalAt(y, x)) {
          return _this._player;
        }
      },

      gameIsOver: function gameIsOver() {
        return _this.isOver();
      }
    };

    this._game = new _game2.default(this._boardElement);
    this._game.setup(gameOptions);
  },

  isOver: function isOver() {
    return this._game.isOver();
  },

  currentPlayer: function currentPlayer() {
    return this._game.currentPlayer();
  },

  receivePlay: function receivePlay(y, x) {
    if (this._player === this.currentPlayer()) {
      return;
    }

    this._game.playAt(y, x);
  },

  moveNumber: function moveNumber() {
    return this._game.moveNumber();
  },

  receivePass: function receivePass() {
    if (this._player === this.currentPlayer()) {
      return;
    }

    this._game.pass();
  },

  receiveMarkDeadAt: function receiveMarkDeadAt(y, x) {
    this._game.toggleDeadAt(y, x);
  },

  deadStones: function deadStones() {
    return this._game.deadStones();
  },

  setDeadStones: function setDeadStones(points) {
    this._game._deadPoints = points.map(function (i) {
      return {
        y: i.y,
        x: i.x
      };
    });

    this._game.render();
  },

  pass: function pass() {
    var _this2 = this;

    if (this._busy || this._player !== this.currentPlayer()) {
      return;
    }

    this._busy = true;

    this._hooks.submitPass(function (result) {
      if (result) {
        _this2._game.pass();
      }

      _this2._busy = false;
    });
  }
};

exports.default = Client;


},{"./game":6}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _utils = require("./utils");

var _utils2 = _interopRequireDefault(_utils);

var _renderer = require("./renderer");

var _renderer2 = _interopRequireDefault(_renderer);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var DOMRenderer = function DOMRenderer(boardElement, _ref) {
  var hooks = _ref.hooks;
  var options = _ref.options;

  _renderer2.default.call(this, boardElement, { hooks: hooks, options: options });

  if (this.smallerStones) {
    _utils2.default.addClass(boardElement, "tenuki-smaller-stones");
  }

  _utils2.default.addClass(boardElement, "tenuki-dom-renderer");
};

DOMRenderer.prototype = Object.create(_renderer2.default.prototype);
DOMRenderer.prototype.constructor = DOMRenderer;

DOMRenderer.prototype._setup = function (boardState) {
  _renderer2.default.prototype._setup.call(this, boardState);

  this.BOARD_LENGTH += 1;
  this.computeSizing();
};

DOMRenderer.prototype.generateBoard = function (boardState) {
  var renderer = this;
  var boardElement = this.boardElement;
  var zoomContainer = renderer.zoomContainer;

  _utils2.default.appendElement(zoomContainer, _utils2.default.createElement("div", { class: "lines horizontal" }));
  _utils2.default.appendElement(zoomContainer, _utils2.default.createElement("div", { class: "lines vertical" }));
  _utils2.default.appendElement(zoomContainer, _utils2.default.createElement("div", { class: "hoshi-points" }));
  _utils2.default.appendElement(zoomContainer, _utils2.default.createElement("div", { class: "intersections" }));

  _renderer2.default.hoshiPositionsFor(boardState.boardSize).forEach(function (h) {
    var hoshi = _utils2.default.createElement("div", { class: "hoshi" });
    hoshi.style.left = h.left * (renderer.INTERSECTION_GAP_SIZE + 1) + "px";
    hoshi.style.top = h.top * (renderer.INTERSECTION_GAP_SIZE + 1) + "px";

    _utils2.default.appendElement(boardElement.querySelector(".hoshi-points"), hoshi);
  });

  for (var y = 0; y < boardState.boardSize; y++) {
    var horizontalLine = _utils2.default.createElement("div", { class: "line horizontal" });
    horizontalLine.setAttribute("data-left-gutter", boardState.yCoordinateFor(y));
    _utils2.default.appendElement(boardElement.querySelector(".lines.horizontal"), horizontalLine);

    var verticalLine = _utils2.default.createElement("div", { class: "line vertical" });
    verticalLine.setAttribute("data-top-gutter", boardState.xCoordinateFor(y));
    _utils2.default.appendElement(boardElement.querySelector(".lines.vertical"), verticalLine);

    for (var x = 0; x < boardState.boardSize; x++) {
      var intersectionElement = _utils2.default.createElement("div", { class: "intersection empty" });
      var stoneElement = _utils2.default.createElement("div", { class: "stone" });
      _utils2.default.appendElement(intersectionElement, stoneElement);

      intersectionElement.setAttribute("data-position-x", x);
      intersectionElement.setAttribute("data-position-y", y);

      intersectionElement.style.left = x * (renderer.INTERSECTION_GAP_SIZE + 1) + "px";
      intersectionElement.style.top = y * (renderer.INTERSECTION_GAP_SIZE + 1) + "px";

      _utils2.default.appendElement(boardElement.querySelector(".intersections"), intersectionElement);

      renderer.grid[y] = renderer.grid[y] || [];
      renderer.grid[y][x] = intersectionElement;

      this.addIntersectionEventListeners(intersectionElement, y, x);
    }
  }

  // prevent the text-selection cursor
  _utils2.default.addEventListener(boardElement.querySelector(".lines.horizontal"), "mousedown", function (e) {
    e.preventDefault();
  });
  _utils2.default.addEventListener(boardElement.querySelector(".lines.vertical"), "mousedown", function (e) {
    e.preventDefault();
  });

  boardElement.querySelector(".lines.horizontal").style.width = renderer.INTERSECTION_GAP_SIZE * (boardState.boardSize - 1) + boardState.boardSize + "px";
  boardElement.querySelector(".lines.horizontal").style.height = renderer.INTERSECTION_GAP_SIZE * (boardState.boardSize - 1) + boardState.boardSize + "px";
  boardElement.querySelector(".lines.vertical").style.width = renderer.INTERSECTION_GAP_SIZE * (boardState.boardSize - 1) + boardState.boardSize + "px";
  boardElement.querySelector(".lines.vertical").style.height = renderer.INTERSECTION_GAP_SIZE * (boardState.boardSize - 1) + boardState.boardSize + "px";
};

DOMRenderer.prototype.setIntersectionClasses = function (intersectionEl, intersection, classes) {
  if (intersectionEl.className !== classes.join(" ")) {
    intersectionEl.className = classes.join(" ");
  }
};

exports.default = DOMRenderer;


},{"./renderer":10,"./utils":14}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var EyePoint = function EyePoint(boardState, intersection) {
  this.boardState = boardState;
  this.intersection = intersection;

  Object.freeze(this);
};

EyePoint.prototype = {
  diagonals: function diagonals() {
    var _this = this;

    var diagonals = [];

    var possibleX = [];
    var possibleY = [];

    if (this.intersection.x > 0) {
      possibleX.push(this.intersection.x - 1);
    }

    if (this.intersection.x < this.boardState.boardSize - 1) {
      possibleX.push(this.intersection.x + 1);
    }

    if (this.intersection.y > 0) {
      possibleY.push(this.intersection.y - 1);
    }

    if (this.intersection.y < this.boardState.boardSize - 1) {
      possibleY.push(this.intersection.y + 1);
    }

    possibleX.forEach(function (x) {
      possibleY.forEach(function (y) {
        diagonals.push(_this.boardState.intersectionAt(y, x));
      });
    });

    return diagonals;
  },

  isFalse: function isFalse() {
    if (!this.intersection.isEmpty()) {
      return false;
    }

    var diagonals = this.diagonals();
    var onFirstLine = diagonals.length <= 2;

    var neighbors = this.neighbors();
    var occupiedNeighbors = neighbors.filter(function (i) {
      return !i.isEmpty();
    });

    if (onFirstLine && occupiedNeighbors.length < 1) {
      return false;
    }

    if (!onFirstLine && occupiedNeighbors.length < 2) {
      return false;
    }

    var opposingOccupiedDiagonals = diagonals.filter(function (d) {
      return !d.isEmpty() && !d.sameColorAs(occupiedNeighbors[0]);
    });

    if (onFirstLine) {
      return opposingOccupiedDiagonals.length >= 1;
    } else {
      return opposingOccupiedDiagonals.length >= 2;
    }
  },

  neighbors: function neighbors() {
    return this.boardState.neighborsFor(this.intersection.y, this.intersection.x);
  },

  filledColor: function filledColor() {
    if (!this.isFalse()) {
      throw new Error("Attempting to find filled color for a non-false eye");
    }

    return this.neighbors()[0].value;
  }
};

exports.default = EyePoint;


},{}],6:[function(require,module,exports){
"use strict";

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
  return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

var _domRenderer = require("./dom-renderer");

var _domRenderer2 = _interopRequireDefault(_domRenderer);

var _svgRenderer = require("./svg-renderer");

var _svgRenderer2 = _interopRequireDefault(_svgRenderer);

var _nullRenderer = require("./null-renderer");

var _nullRenderer2 = _interopRequireDefault(_nullRenderer);

var _boardState = require("./board-state");

var _boardState2 = _interopRequireDefault(_boardState);

var _ruleset = require("./ruleset");

var _ruleset2 = _interopRequireDefault(_ruleset);

var _scorer = require("./scorer");

var _scorer2 = _interopRequireDefault(_scorer);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var VALID_GAME_OPTIONS = ["boardSize", "scoring", "handicapStones", "koRule", "komi", "_hooks", "fuzzyStonePlacement", "renderer", "freeHandicapPlacement"];

var Game = function Game(boardElement) {
  this._defaultBoardSize = 19;
  this.boardSize = null;
  this._moves = [];
  this.callbacks = {
    postRender: function postRender() {}
  };
  this._boardElement = boardElement;
  this._defaultScoring = "territory";
  this._defaultKoRule = "simple";
  this._defaultRenderer = "svg";
  this._deadPoints = [];
};

Game.prototype = {
  _configureOptions: function _configureOptions() {
    var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var _ref$boardSize = _ref.boardSize;
    var boardSize = _ref$boardSize === undefined ? this._defaultBoardSize : _ref$boardSize;
    var _ref$komi = _ref.komi;
    var komi = _ref$komi === undefined ? 0 : _ref$komi;
    var _ref$handicapStones = _ref.handicapStones;
    var handicapStones = _ref$handicapStones === undefined ? 0 : _ref$handicapStones;
    var _ref$freeHandicapPlac = _ref.freeHandicapPlacement;
    var freeHandicapPlacement = _ref$freeHandicapPlac === undefined ? false : _ref$freeHandicapPlac;
    var _ref$scoring = _ref.scoring;
    var scoring = _ref$scoring === undefined ? this._defaultScoring : _ref$scoring;
    var _ref$koRule = _ref.koRule;
    var koRule = _ref$koRule === undefined ? this._defaultKoRule : _ref$koRule;
    var _ref$renderer = _ref.renderer;
    var renderer = _ref$renderer === undefined ? this._defaultRenderer : _ref$renderer;

    if (typeof boardSize !== "number") {
      throw new Error("Board size must be a number, but was: " + (typeof boardSize === "undefined" ? "undefined" : _typeof(boardSize)));
    }

    if (typeof handicapStones !== "number") {
      throw new Error("Handicap stones must be a number, but was: " + (typeof boardSize === "undefined" ? "undefined" : _typeof(boardSize)));
    }

    if (handicapStones > 0 && boardSize !== 9 && boardSize !== 13 && boardSize !== 19) {
      throw new Error("Handicap stones not supported on sizes other than 9x9, 13x13 and 19x19");
    }

    if (handicapStones < 0 || handicapStones === 1 || handicapStones > 9) {
      throw new Error("Only 2 to 9 handicap stones are supported");
    }

    if (boardSize > 19) {
      throw new Error("cannot generate a board size greater than 19");
    }

    this.boardSize = boardSize;
    this.handicapStones = handicapStones;
    this._freeHandicapPlacement = freeHandicapPlacement;

    this._scorer = new _scorer2.default({
      scoreBy: scoring,
      komi: komi
    });

    this._rendererChoice = {
      "dom": _domRenderer2.default,
      "svg": _svgRenderer2.default
    }[renderer];

    if (!this._rendererChoice) {
      throw new Error("Unknown renderer: " + renderer);
    }

    this._whiteMustPassLast = this._scorer.usingPassStones();

    this._ruleset = new _ruleset2.default({
      koRule: koRule
    });

    if (this._freeHandicapPlacement) {
      this._initialState = _boardState2.default._initialFor(boardSize, 0);
    } else {
      this._initialState = _boardState2.default._initialFor(boardSize, handicapStones);
    }
  },

  _stillPlayingHandicapStones: function _stillPlayingHandicapStones() {
    return this._freeHandicapPlacement && this.handicapStones > 0 && this._moves.length < this.handicapStones;
  },

  setup: function setup() {
    var _this = this;

    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    for (var key in options) {
      if (options.hasOwnProperty(key) && VALID_GAME_OPTIONS.indexOf(key) < 0) {
        throw new Error("Unrecognized game option: " + key);
      }
    }

    this._configureOptions(options);

    if (this._boardElement) {
      var defaultRendererHooks = {
        handleClick: function handleClick(y, x) {
          if (_this.isOver()) {
            _this.toggleDeadAt(y, x);
          } else {
            _this.playAt(y, x);
          }
        },

        hoverValue: function hoverValue(y, x) {
          if (!_this.isOver() && !_this.isIllegalAt(y, x)) {
            return _this.currentPlayer();
          }
        },

        gameIsOver: function gameIsOver() {
          return _this.isOver();
        }
      };

      this.renderer = new this._rendererChoice(this._boardElement, {
        hooks: options["_hooks"] || defaultRendererHooks,
        options: {
          fuzzyStonePlacement: options["fuzzyStonePlacement"]
        }
      });
    } else {
      this.renderer = new _nullRenderer2.default();
    }

    this.render();
  },

  intersectionAt: function intersectionAt(y, x) {
    return this.currentState().intersectionAt(y, x);
  },

  intersections: function intersections() {
    return this.currentState().intersections;
  },

  deadStones: function deadStones() {
    return this._deadPoints;
  },

  coordinatesFor: function coordinatesFor(y, x) {
    return this.currentState().xCoordinateFor(x) + this.currentState().yCoordinateFor(y);
  },

  currentPlayer: function currentPlayer() {
    if (this._stillPlayingHandicapStones()) {
      return "black";
    }

    var lastMoveColor = this.currentState().color;

    if (lastMoveColor === "black") {
      return "white";
    } else {
      return "black";
    }
  },

  isWhitePlaying: function isWhitePlaying() {
    return this.currentPlayer() === "white";
  },

  isBlackPlaying: function isBlackPlaying() {
    return this.currentPlayer() === "black";
  },

  score: function score() {
    return this._scorer.score(this);
  },

  currentState: function currentState() {
    return this._moves[this._moves.length - 1] || this._initialState;
  },

  moveNumber: function moveNumber() {
    return this.currentState().moveNumber;
  },

  playAt: function playAt(y, x) {
    if (this.isIllegalAt(y, x)) {
      return false;
    }

    var newState = this.currentState().playAt(y, x, this.currentPlayer());
    this._moves.push(newState);

    this.render();

    return true;
  },

  pass: function pass() {
    if (this.isOver()) {
      return false;
    }

    var newState = this.currentState().playPass(this.currentPlayer());
    this._moves.push(newState);

    this.render();

    return true;
  },

  isOver: function isOver() {
    if (this._moves.length < 2) {
      return false;
    }

    if (this._whiteMustPassLast) {
      var finalMove = this._moves[this._moves.length - 1];
      var previousMove = this._moves[this._moves.length - 2];

      return finalMove.pass && previousMove.pass && finalMove.color === "white";
    } else {
      var _finalMove = this._moves[this._moves.length - 1];
      var _previousMove = this._moves[this._moves.length - 2];

      return _finalMove.pass && _previousMove.pass;
    }
  },

  toggleDeadAt: function toggleDeadAt(y, x) {
    var _this2 = this;

    if (this.intersectionAt(y, x).isEmpty()) {
      return;
    }

    var alreadyDead = this._isDeadAt(y, x);

    this.currentState().groupAt(y, x).forEach(function (intersection) {
      if (alreadyDead) {
        _this2._deadPoints = _this2._deadPoints.filter(function (dead) {
          return !(dead.y === intersection.y && dead.x === intersection.x);
        });
      } else {
        _this2._deadPoints.push({ y: intersection.y, x: intersection.x });
      }
    });

    this.render();

    return true;
  },

  _isDeadAt: function _isDeadAt(y, x) {
    return this._deadPoints.some(function (dead) {
      return dead.y === y && dead.x === x;
    });
  },

  isIllegalAt: function isIllegalAt(y, x) {
    return this._ruleset.isIllegal(y, x, this);
  },

  territory: function territory() {
    if (!this.isOver()) {
      return {
        black: [],
        white: []
      };
    }

    return this._scorer.territory(this);
  },

  undo: function undo() {
    this._moves.pop();
    this.render();
  },

  render: function render() {
    if (!this.isOver()) {
      this._deadPoints = [];
    }

    this.renderer.render(this.currentState(), {
      territory: this.territory(),
      deadStones: this.deadStones()
    });

    this.callbacks.postRender(this);
  }
};

exports.default = Game;


},{"./board-state":2,"./dom-renderer":4,"./null-renderer":8,"./ruleset":11,"./scorer":12,"./svg-renderer":13}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var Intersection = function Intersection(y, x, value) {
  this.y = y;
  this.x = x;
  this.value = value || "empty";

  Object.freeze(this);
};

Intersection.prototype = {
  isOccupiedWith: function isOccupiedWith(color) {
    if (this.isEmpty()) {
      return false;
    }

    return this.value === color;
  },

  isBlack: function isBlack() {
    return this.value === "black";
  },

  isWhite: function isWhite() {
    return this.value === "white";
  },

  isEmpty: function isEmpty() {
    return this.value === "empty";
  },

  sameColorAs: function sameColorAs(otherIntersection) {
    return this.value === otherIntersection.value;
  }
};

exports.default = Intersection;


},{}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = NullRenderer;
function NullRenderer() {
  this.setup = function () {};
  this.render = function () {};
  this.renderTerritory = function () {};
}


},{}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;_e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }return _arr;
  }return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

var _utils = require("./utils");

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var Region = function Region(boardState, intersections) {
  this.boardState = boardState;
  this.intersections = intersections;

  Object.freeze(this);
};

Region._startingAt = function (boardState, y, x) {
  var startingPoint = boardState.intersectionAt(y, x);

  var _boardState$partition = boardState.partitionTraverse(startingPoint, function (neighbor) {
    return neighbor.sameColorAs(startingPoint);
  });

  var _boardState$partition2 = _slicedToArray(_boardState$partition, 2);

  var includedPoints = _boardState$partition2[0];
  var boundaryPoints = _boardState$partition2[1];

  return [includedPoints, boundaryPoints];
};

Region.allFor = function (boardState) {
  var checkedPoints = [];
  var regions = [];

  boardState.intersections.forEach(function (point) {
    if (checkedPoints.indexOf(point) > -1) {
      // do nothing
    } else {
        var _boardState$partition3 = boardState.partitionTraverse(point, function (neighbor) {
          return neighbor.sameColorAs(point);
        });

        var _boardState$partition4 = _slicedToArray(_boardState$partition3, 2);

        var regionPoints = _boardState$partition4[0];
        var _ = _boardState$partition4[1];

        regions.push(new Region(boardState, regionPoints));
        checkedPoints = checkedPoints.concat(regionPoints);
      }
  });

  return regions;
};

Region.merge = function (regions, region) {
  var mergedRegions = [region];
  var length = -1;

  while (mergedRegions.length !== length) {
    length = mergedRegions.length;

    mergedRegions = regions.filter(function (r) {
      return r.isEmpty() && r.isTerritory() && r.territoryColor() === region.territoryColor() && r.expandedBoundaryStones().some(function (stone) {
        return mergedRegions.some(function (latestRegion) {
          return latestRegion.expandedBoundaryStones().indexOf(stone) > -1;
        });
      });
    });
  }

  return mergedRegions;
};

Region.prototype = {
  isEmpty: function isEmpty() {
    return this.intersections[0].isEmpty();
  },

  isTerritory: function isTerritory() {
    var point = this.intersections[0];

    if (!point.isEmpty()) {
      return false;
    }

    var _Region$_startingAt = Region._startingAt(this.boardState, point.y, point.x);

    var _Region$_startingAt2 = _slicedToArray(_Region$_startingAt, 2);

    var _ = _Region$_startingAt2[0];
    var boundaryPoints = _Region$_startingAt2[1];

    var surroundingColors = _utils2.default.unique(boundaryPoints.map(function (i) {
      return i.value;
    }));
    var isTerritory = surroundingColors.length === 1 && surroundingColors[0] !== "empty";

    return isTerritory;
  },

  territoryColor: function territoryColor() {
    var point = this.intersections[0];

    var _Region$_startingAt3 = Region._startingAt(this.boardState, point.y, point.x);

    var _Region$_startingAt4 = _slicedToArray(_Region$_startingAt3, 2);

    var _ = _Region$_startingAt4[0];
    var boundaryPoints = _Region$_startingAt4[1];

    var surroundingColors = _utils2.default.unique(boundaryPoints.map(function (i) {
      return i.value;
    }));
    var isTerritory = surroundingColors.length === 1 && surroundingColors[0] !== "empty";

    if (!point.isEmpty() || !isTerritory) {
      throw new Error("Attempted to obtain territory color for something that isn't territory, region containing " + point.y + "," + point.x);
    } else {
      return surroundingColors[0];
    }
  },

  isBlack: function isBlack() {
    return this.territoryColor() === "black";
  },

  isWhite: function isWhite() {
    return this.territoryColor() === "white";
  },

  isNeutral: function isNeutral() {
    return !this.intersections[0].isBlack() && !this.intersections[0].isWhite() && !this.isTerritory();
  },

  exterior: function exterior() {
    var _this = this;

    return this.boardState.intersections.filter(function (i) {
      return _this.intersections.indexOf(i) < 0 && _this.boardState.neighborsFor(i.y, i.x).some(function (neighbor) {
        return _this.intersections.indexOf(neighbor) > -1;
      });
    });
  },

  boundaryStones: function boundaryStones() {
    var _this2 = this;

    if (!this.isEmpty()) {
      throw new Error("Attempted to obtain boundary stones for non-empty region");
    }

    return this.exterior().filter(function (i) {
      return !i.sameColorAs(_this2.intersections[0]);
    });
  },

  expandedBoundaryStones: function expandedBoundaryStones() {
    var boundaryStones = this.boundaryStones();
    var regions = Region.allFor(this.boardState).filter(function (r) {
      return r.intersections.some(function (i) {
        return boundaryStones.indexOf(i) > -1;
      });
    });

    return _utils2.default.flatMap(regions, function (r) {
      return r.intersections;
    });
  },

  lengthOfTerritoryBoundary: function lengthOfTerritoryBoundary() {
    var _this3 = this;

    // count the empty border points to treat the edge of the board itself as points
    var borderPoints = this.intersections.filter(function (i) {
      return i.y === 0 || i.y === _this3.boardState.boardSize - 1 || i.x === 0 || i.x === _this3.boardState.boardSize - 1;
    });
    var cornerPoints = this.intersections.filter(function (i) {
      return i.y % _this3.boardState.boardSize - 1 === 0 && i.x % _this3.boardState.boardSize - 1 === 0;
    });

    return this.boundaryStones().length + borderPoints.length + cornerPoints.length;
  },

  containsSquareFour: function containsSquareFour() {
    var _this4 = this;

    return this.intersections.some(function (i) {
      return [[0, 0], [0, 1], [1, 0], [1, 1]].every(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2);

        var y = _ref2[0];
        var x = _ref2[1];

        var intersection = _this4.boardState.intersectionAt(i.y + y, i.x + x);
        return typeof intersection !== "undefined" && intersection.sameColorAs(i);
      });
    });
  },

  containsCurvedFour: function containsCurvedFour() {
    var _this5 = this;

    return this.intersections.some(function (i) {
      return [[[0, 0], [1, 0], [2, 0], [2, 1]], [[-1, 2], [0, 0], [0, 1], [0, 2]], [[0, 0], [0, 1], [1, 1], [2, 1]], [[-1, 0], [-1, 1], [-1, 2], [0, 0]], [[-2, 1], [-1, 1], [0, 0], [0, 1]], [[0, 0], [1, 0], [1, 1], [1, 2]], [[0, -1], [0, 0], [1, -1], [2, -1]], [[-1, -2], [-1, -1], [-1, 0], [0, 0]]].some(function (expectedPoints) {
        return expectedPoints.every(function (_ref3) {
          var _ref4 = _slicedToArray(_ref3, 2);

          var y = _ref4[0];
          var x = _ref4[1];

          var intersection = _this5.boardState.intersectionAt(i.y + y, i.x + x);
          return typeof intersection !== "undefined" && intersection.sameColorAs(i);
        });
      });
    });
  },

  numberOfEyes: function numberOfEyes() {
    if (!this.intersections[0].isEmpty()) {
      throw new Error("Unexpected calculation of number of eyes for a non-empty region containing " + this.intersections[0].y + "," + this.intersections[0].x);
    }

    var boundaryLength = this.lengthOfTerritoryBoundary();

    if (boundaryLength < 2) {
      throw new Error("Unexpected boundary length of " + boundaryLength + " for region including " + this.intersections[0].y + "," + this.intersections[0].x);
    }

    if (boundaryLength >= 10) {
      return 2;
    }

    var eyes = void 0;

    switch (boundaryLength) {
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
        eyes = 1;
        break;
      case 7:
        eyes = 1.5;
        break;
      case 8:
        if (this.containsSquareFour()) {
          eyes = 1;
        } else if (this.containsCurvedFour()) {
          eyes = 2;
        } else {
          eyes = 1.5;
        }

        break;
      case 9:
        if (this.containsSquareFour()) {
          eyes = 1.5;
        } else {
          eyes = 2;
        }
        break;

      default:
        throw new Error("unhandled boundary length " + boundaryLength);
    }

    return eyes;
  }
};

exports.default = Region;


},{"./utils":14}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;_e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }return _arr;
  }return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

var _utils = require("./utils");

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var Renderer = function Renderer(boardElement, _ref) {
  var hooks = _ref.hooks;
  var options = _ref.options;

  this.INTERSECTION_GAP_SIZE = 28;
  this.GUTTER_MARGIN = this.INTERSECTION_GAP_SIZE - 3;
  this.BASE_MARGIN = this.INTERSECTION_GAP_SIZE - 10;
  this.hasCoordinates = boardElement.hasAttribute("data-include-coordinates");
  this.MARGIN = this.hasCoordinates ? this.BASE_MARGIN + this.GUTTER_MARGIN : this.BASE_MARGIN;
  this.boardElement = boardElement;
  this.grid = [];
  this.hooks = hooks || {};
  this._options = options || {};
  this._initialized = false;

  if (this._options["fuzzyStonePlacement"]) {
    _utils2.default.addClass(boardElement, "tenuki-fuzzy-placement");
    _utils2.default.addClass(boardElement, "tenuki-board-textured");
    this.smallerStones = true;
  }

  if (_utils2.default.hasClass(boardElement, "tenuki-board-textured")) {
    this.texturedStones = true;
  }
};

Renderer.hoshiPositionsFor = function (boardSize) {
  var hoshiElements = [];

  if (boardSize < 7) {
    if (boardSize > 1 && boardSize % 2 === 1) {
      var hoshi = {};
      hoshi.top = (boardSize - 1) / 2;
      hoshi.left = hoshi.top;

      hoshiElements.push(hoshi);
    } else {
      // no hoshi
    }
  } else {
      var hoshiOffset = boardSize > 11 ? 3 : 2;

      for (var hoshiY = 0; hoshiY < 3; hoshiY++) {
        for (var hoshiX = 0; hoshiX < 3; hoshiX++) {
          if ((boardSize === 7 || boardSize % 2 === 0) && (hoshiY === 1 || hoshiX === 1)) {
            continue;
          }

          var _hoshi = {};

          if (hoshiY === 0) {
            _hoshi.top = hoshiOffset;
          }

          if (hoshiY === 1) {
            _hoshi.top = (boardSize + 1) / 2 - 1;
          }

          if (hoshiY === 2) {
            _hoshi.top = boardSize - hoshiOffset - 1;
          }

          if (hoshiX === 0) {
            _hoshi.left = hoshiOffset;
          }

          if (hoshiX === 1) {
            _hoshi.left = (boardSize + 1) / 2 - 1;
          }

          if (hoshiX === 2) {
            _hoshi.left = boardSize - hoshiOffset - 1;
          }

          hoshiElements.push(_hoshi);
        }
      }
    }

  return hoshiElements;
};

Renderer.prototype = {
  _setup: function _setup(boardState) {
    var renderer = this;
    var boardElement = this.boardElement;

    renderer.BOARD_LENGTH = 2 * this.MARGIN + (boardState.boardSize - 1) * (this.INTERSECTION_GAP_SIZE + 1);

    var innerContainer = _utils2.default.createElement("div", { class: "tenuki-inner-container" });
    renderer.innerContainer = innerContainer;
    _utils2.default.appendElement(boardElement, innerContainer);

    var zoomContainer = _utils2.default.createElement("div", { class: "tenuki-zoom-container" });
    renderer.zoomContainer = zoomContainer;
    _utils2.default.appendElement(innerContainer, zoomContainer);

    renderer.cancelZoomElement = _utils2.default.createElement("div", { class: "cancel-zoom" });
    var cancelZoomBackdrop = _utils2.default.createElement("div", { class: "cancel-zoom-backdrop" });
    _utils2.default.addEventListener(renderer.cancelZoomElement, "click", function (event) {
      event.preventDefault();
      renderer.zoomOut();

      return false;
    });
    _utils2.default.addEventListener(cancelZoomBackdrop, "click", function (event) {
      event.preventDefault();
      renderer.zoomOut();

      return false;
    });
    _utils2.default.appendElement(innerContainer, renderer.cancelZoomElement);
    _utils2.default.appendElement(innerContainer, cancelZoomBackdrop);

    // https://developer.mozilla.org/en-US/docs/Web/Events/resize
    var throttle = function throttle(type, name) {
      var running = false;
      var func = function func() {
        if (running) {
          return;
        }

        running = true;

        window.requestAnimationFrame(function () {
          window.dispatchEvent(new CustomEvent(name));
          running = false;
        });
      };
      window.addEventListener(type, func);
    };

    throttle("resize", "optimizedResize");

    this.generateBoard(boardState);

    renderer.computeSizing();

    window.addEventListener("optimizedResize", function () {
      renderer.computeSizing();
    });

    renderer.touchmoveChangedTouch = null;
    renderer.touchstartEventHandler = renderer.handleTouchStart.bind(renderer);
    renderer.touchmoveEventHandler = renderer.handleTouchMove.bind(renderer);
    renderer.touchendEventHandler = renderer.handleTouchEnd.bind(renderer);

    _utils2.default.addEventListener(boardElement, "touchstart", renderer.touchstartEventHandler);
    _utils2.default.addEventListener(boardElement, "touchend", renderer.touchendEventHandler);
    _utils2.default.addEventListener(boardElement, "touchmove", renderer.touchmoveEventHandler);
  },

  computeSizing: function computeSizing() {
    var renderer = this;
    var innerContainer = this.innerContainer;
    var zoomContainer = this.zoomContainer;
    var boardElement = this.boardElement;

    // reset everything so we can calculate against new values
    innerContainer.style.height = "";
    innerContainer.style.width = "";
    zoomContainer.style.height = "";
    zoomContainer.style.width = "";
    innerContainer.style.transform = "";
    // zoomContainer.style.willChange = "";
    boardElement.style.width = "";
    boardElement.style.height = "";

    // dev-friendly reset of whether this is a touch device
    renderer._touchEventFired = null;

    innerContainer.style.width = renderer.BOARD_LENGTH + "px";
    innerContainer.style.height = renderer.BOARD_LENGTH + "px";

    zoomContainer.style.width = renderer.BOARD_LENGTH + "px";
    zoomContainer.style.height = renderer.BOARD_LENGTH + "px";

    var scaleX = innerContainer.parentNode.clientWidth / innerContainer.clientWidth;
    var scaleY = innerContainer.parentNode.clientHeight / innerContainer.clientHeight;
    var scale = Math.min(scaleX, scaleY);

    if (scale > 0 && scale < 1) {
      _utils2.default.addClass(boardElement, "tenuki-scaled");
      innerContainer.style["transform-origin"] = "top left";
      innerContainer.style.transform = "scale3d(" + scale + ", " + scale + ", 1)";

      // we'll potentially be zooming on touch devices
      zoomContainer.style.willChange = "transform";
    }

    // reset the outer element's height to match, ensuring that we free up any lingering whitespace
    boardElement.style.width = innerContainer.getBoundingClientRect().width + "px";
    boardElement.style.height = innerContainer.getBoundingClientRect().height + "px";
  },

  addIntersectionEventListeners: function addIntersectionEventListeners(element, y, x) {
    var renderer = this;

    _utils2.default.addEventListener(element, "mouseenter", function () {
      var hoveredYPosition = y;
      var hoveredXPosition = x;
      var hoverValue = renderer.hooks.hoverValue(hoveredYPosition, hoveredXPosition);

      if (hoverValue) {
        _utils2.default.addClass(element, "hovered");
        _utils2.default.addClass(element, hoverValue);
      }
    });

    _utils2.default.addEventListener(element, "mouseleave", function () {
      if (_utils2.default.hasClass(this, "hovered")) {
        _utils2.default.removeClass(element, "hovered");
        _utils2.default.removeClass(element, "black");
        _utils2.default.removeClass(element, "white");
      }

      renderer.resetTouchedPoint();
    });

    _utils2.default.addEventListener(element, "click", function () {
      var playedYPosition = y;
      var playedXPosition = x;

      // if this isn't part of a touch,
      // or it is and the user is zoomed in,
      // or it's game over and we're marking stones dead,
      // then don't use the zoom/double-select system.
      if (!renderer._touchEventFired || document.body.clientWidth / window.innerWidth > 1 || renderer.hooks.gameIsOver()) {
        renderer.hooks.handleClick(playedYPosition, playedXPosition);
        return;
      }

      if (renderer.touchedPoint) {
        if (element === renderer.touchedPoint) {
          renderer.hooks.handleClick(playedYPosition, playedXPosition);
        } else {
          renderer.showPossibleMoveAt(element, playedYPosition, playedXPosition);
        }
      } else {
        renderer.showPossibleMoveAt(element, playedYPosition, playedXPosition);
      }
    });
  },

  handleTouchStart: function handleTouchStart(event) {
    var renderer = this;
    renderer._touchEventFired = true;

    if (event.touches.length > 1) {
      if (renderer.zoomedIn) {
        event.preventDefault();
      }
      return;
    }

    if (!renderer.zoomedIn) {
      return;
    }

    var xCursor = event.changedTouches[0].clientX;
    var yCursor = event.changedTouches[0].clientY;

    renderer.dragStartX = xCursor;
    renderer.dragStartY = yCursor;
    renderer.zoomContainer.style.transition = "none";
    renderer.animationFrameRequestID = window.requestAnimationFrame(renderer.processDragDelta.bind(renderer));
  },

  handleTouchMove: function handleTouchMove(event) {
    var renderer = this;

    if (event.touches.length > 1) {
      return;
    }

    if (!renderer.zoomedIn) {
      return true;
    }

    // prevent pull-to-refresh
    event.preventDefault();

    renderer.touchmoveChangedTouch = event.changedTouches[0];

    renderer.moveInProgress = true;
  },

  handleTouchEnd: function handleTouchEnd(event) {
    var renderer = this;

    if (event.touches.length > 1) {
      return;
    }

    if (!renderer.zoomedIn) {
      return;
    }

    renderer.zoomContainer.style.transition = "";

    if (!renderer.moveInProgress) {
      return;
    }
    renderer.translateY = renderer.lastTranslateY;
    renderer.translateX = renderer.lastTranslateX;
    renderer.moveInProgress = false;
    renderer.touchmoveChangedTouch = null;
    window.cancelAnimationFrame(renderer.animationFrameRequestID);
  },

  processDragDelta: function processDragDelta() {
    var renderer = this;

    if (!renderer.touchmoveChangedTouch) {
      renderer.animationFrameRequestID = window.requestAnimationFrame(renderer.processDragDelta.bind(renderer));
      return;
    }

    var innerContainer = renderer.innerContainer;

    var xCursor = renderer.touchmoveChangedTouch.clientX;
    var yCursor = renderer.touchmoveChangedTouch.clientY;

    var deltaX = xCursor - renderer.dragStartX;
    var deltaY = yCursor - renderer.dragStartY;

    var translateY = renderer.translateY + deltaY / 2.5;
    var translateX = renderer.translateX + deltaX / 2.5;

    if (translateY > 0.5 * innerContainer.clientHeight - renderer.MARGIN) {
      translateY = 0.5 * innerContainer.clientHeight - renderer.MARGIN;
    }

    if (translateX > 0.5 * innerContainer.clientWidth - renderer.MARGIN) {
      translateX = 0.5 * innerContainer.clientWidth - renderer.MARGIN;
    }

    if (translateY < -0.5 * innerContainer.clientHeight + renderer.MARGIN) {
      translateY = -0.5 * innerContainer.clientHeight + renderer.MARGIN;
    }

    if (translateX < -0.5 * innerContainer.clientWidth + renderer.MARGIN) {
      translateX = -0.5 * innerContainer.clientWidth + renderer.MARGIN;
    }

    renderer.zoomContainer.style.transform = "translate3d(" + 2.5 * translateX + "px, " + 2.5 * translateY + "px, 0) scale3d(2.5, 2.5, 1)";

    renderer.lastTranslateX = translateX;
    renderer.lastTranslateY = translateY;

    renderer.animationFrameRequestID = window.requestAnimationFrame(renderer.processDragDelta.bind(renderer));
  },

  showPossibleMoveAt: function showPossibleMoveAt(intersectionElement, y, x) {
    var renderer = this;
    var boardElement = this.boardElement;
    var zoomContainer = this.zoomContainer;

    renderer.zoomContainerHeight = renderer.zoomContainerHeight || zoomContainer.clientHeight;
    renderer.zoomContainerWidth = renderer.zoomContainerWidth || zoomContainer.clientWidth;

    renderer.touchedPoint = intersectionElement;

    if (_utils2.default.hasClass(boardElement, "tenuki-scaled")) {
      var top = y * (this.INTERSECTION_GAP_SIZE + 1);
      var left = x * (this.INTERSECTION_GAP_SIZE + 1);

      var translateY = 0.5 * renderer.zoomContainerHeight - top - renderer.MARGIN;
      var translateX = 0.5 * renderer.zoomContainerWidth - left - renderer.MARGIN;

      zoomContainer.style.transform = "translate3d(" + 2.5 * translateX + "px, " + 2.5 * translateY + "px, 0) scale3d(2.5, 2.5, 1)";
      renderer.translateY = translateY;
      renderer.translateX = translateX;

      _utils2.default.addClass(renderer.cancelZoomElement, "visible");
      renderer.zoomedIn = true;
    }
  },

  resetTouchedPoint: function resetTouchedPoint() {
    var renderer = this;

    renderer.touchedPoint = null;
  },

  zoomOut: function zoomOut() {
    var renderer = this;

    this.resetTouchedPoint();
    renderer.zoomContainer.style.transform = "";
    renderer.zoomContainer.style.transition = "";
    renderer.dragStartX = null;
    renderer.dragStartY = null;
    renderer.translateY = null;
    renderer.translateX = null;
    renderer.lastTranslateX = null;
    renderer.lastTranslateY = null;

    _utils2.default.removeClass(renderer.cancelZoomElement, "visible");
    renderer.zoomedIn = false;
  },

  render: function render(boardState) {
    var _this = this;

    var _ref2 = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var territory = _ref2.territory;
    var deadStones = _ref2.deadStones;

    if (!this._initialized) {
      this._setup(boardState);
      this._initialized = true;
    }

    this.resetTouchedPoint();

    this.renderStonesPlayed(boardState.intersections);

    var playedPoint = boardState.playedPoint;

    this.updateMarkerPoints({ playedPoint: playedPoint, koPoint: boardState.koPoint });

    if (this._options["fuzzyStonePlacement"] && playedPoint) {
      var verticalShiftClasses = ["v-shift-up", "v-shift-upup", "v-shift-down", "v-shift-downdown", "v-shift-none"];

      var horizontalShiftClasses = ["h-shift-left", "h-shift-leftleft", "h-shift-right", "h-shift-rightright", "h-shift-none"];

      var shiftClasses = verticalShiftClasses.concat(horizontalShiftClasses);

      var alreadyShifted = shiftClasses.some(function (c) {
        return _utils2.default.hasClass(_this.grid[playedPoint.y][playedPoint.x], c);
      });

      if (!alreadyShifted) {
        (function () {
          var possibleShifts = _utils2.default.cartesianProduct(verticalShiftClasses, horizontalShiftClasses);

          var _possibleShifts$Math$ = _slicedToArray(possibleShifts[Math.floor(Math.random() * possibleShifts.length)], 2);

          var playedVerticalShift = _possibleShifts$Math$[0];
          var playedHorizontalShift = _possibleShifts$Math$[1];

          [[-1, 0], [0, -1], [0, 1], [1, 0]].forEach(function (_ref3) {
            var _ref4 = _slicedToArray(_ref3, 2);

            var y = _ref4[0];
            var x = _ref4[1];

            if (_this.grid[playedPoint.y + y] && _this.grid[playedPoint.y + y][playedPoint.x + x]) {
              (function () {
                var neighboringElement = _this.grid[playedPoint.y + y][playedPoint.x + x];

                if (!_utils2.default.hasClass(neighboringElement, "empty")) {
                  [[-1, 0, "v-shift-downdown", "v-shift-up", "v-shift-down"], [-1, 0, "v-shift-downdown", "v-shift-upup", "v-shift-none"], [-1, 0, "v-shift-down", "v-shift-upup", "v-shift-none"], [1, 0, "v-shift-upup", "v-shift-down", "v-shift-up"], [1, 0, "v-shift-upup", "v-shift-downdown", "v-shift-none"], [1, 0, "v-shift-up", "v-shift-downdown", "v-shift-none"], [0, -1, "h-shift-rightright", "h-shift-left", "h-shift-right"], [0, -1, "h-shift-rightright", "h-shift-leftleft", "h-shift-none"], [0, -1, "h-shift-right", "h-shift-leftleft", "h-shift-none"], [0, 1, "h-shift-leftleft", "h-shift-right", "h-shift-left"], [0, 1, "h-shift-leftleft", "h-shift-rightright", "h-shift-none"], [0, 1, "h-shift-left", "h-shift-rightright", "h-shift-none"]].forEach(function (_ref5) {
                    var _ref6 = _slicedToArray(_ref5, 5);

                    var requiredYOffset = _ref6[0];
                    var requiredXOffset = _ref6[1];
                    var requiredNeighborShift = _ref6[2];
                    var conflictingPlayedShift = _ref6[3];
                    var newNeighborShift = _ref6[4];

                    if (y === requiredYOffset && x === requiredXOffset && _utils2.default.hasClass(neighboringElement, requiredNeighborShift) && (playedVerticalShift === conflictingPlayedShift || playedHorizontalShift === conflictingPlayedShift)) {
                      _utils2.default.removeClass(neighboringElement, requiredNeighborShift);
                      _utils2.default.addClass(neighboringElement, newNeighborShift);
                    }
                  });
                }
              })();
            }
          });

          _utils2.default.addClass(_this.grid[playedPoint.y][playedPoint.x], playedVerticalShift);
          _utils2.default.addClass(_this.grid[playedPoint.y][playedPoint.x], playedHorizontalShift);
        })();
      }
    }

    if (territory) {
      this.renderTerritory(territory, deadStones);
    }
  },

  renderStonesPlayed: function renderStonesPlayed(intersections) {
    var _this2 = this;

    intersections.forEach(function (intersection) {
      _this2.renderIntersection(intersection);
    });
  },

  updateMarkerPoints: function updateMarkerPoints(_ref7) {
    var playedPoint = _ref7.playedPoint;
    var koPoint = _ref7.koPoint;

    var renderer = this;

    if (koPoint) {
      _utils2.default.addClass(renderer.grid[koPoint.y][koPoint.x], "ko");
    }

    if (playedPoint) {
      _utils2.default.addClass(renderer.grid[playedPoint.y][playedPoint.x], "played");
    }
  },

  renderIntersection: function renderIntersection(intersection) {
    var renderer = this;

    var intersectionEl = renderer.grid[intersection.y][intersection.x];

    var classes = ["intersection"];

    if (intersection.isEmpty()) {
      classes.push("empty");
    } else {
      classes.push("occupied");

      if (intersection.isBlack()) {
        classes.push("black");
      } else {
        classes.push("white");
      }

      var shiftClasses = ["v-shift-up", "v-shift-upup", "v-shift-down", "v-shift-downdown", "v-shift-none", "h-shift-left", "h-shift-leftleft", "h-shift-right", "h-shift-rightright", "h-shift-none"];

      shiftClasses.forEach(function (shiftClass) {
        if (_utils2.default.hasClass(intersectionEl, shiftClass)) {
          classes.push(shiftClass);
        }
      });
    }

    this.setIntersectionClasses(intersectionEl, intersection, classes);
  },

  renderTerritory: function renderTerritory(territory, deadStones) {
    var _this3 = this;

    _utils2.default.flatten(this.grid).forEach(function (element) {
      _utils2.default.removeClass(element, "territory-black");
      _utils2.default.removeClass(element, "territory-white");
      _utils2.default.removeClass(element, "dead");
    });

    deadStones.forEach(function (point) {
      _utils2.default.addClass(_this3.grid[point.y][point.x], "dead");
    });

    territory.black.forEach(function (territoryPoint) {
      _utils2.default.addClass(_this3.grid[territoryPoint.y][territoryPoint.x], "territory-black");
    });

    territory.white.forEach(function (territoryPoint) {
      _utils2.default.addClass(_this3.grid[territoryPoint.y][territoryPoint.x], "territory-white");
    });
  }
};

exports.default = Renderer;


},{"./utils":14}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var VALID_KO_OPTIONS = ["simple", "superko"];

var Ruleset = function Ruleset(_ref) {
  var koRule = _ref.koRule;

  this.koRule = koRule;

  if (VALID_KO_OPTIONS.indexOf(this.koRule) < 0) {
    throw new Error("Unknown ko rule: " + koRule);
  }

  Object.freeze(this);
};

Ruleset.prototype = {
  isIllegal: function isIllegal(y, x, game) {
    var boardState = game.currentState();
    var nextColor = game.currentPlayer();
    var intersection = boardState.intersectionAt(y, x);

    var result = !intersection.isEmpty() || this._wouldBeSuicide(y, x, nextColor, boardState) || this._isKoViolation(y, x, nextColor, boardState, game._moves);

    return result;
  },

  _isKoViolation: function _isKoViolation(y, x, color, boardState, existingStates) {
    var isKoViolation = false;

    if (this.koRule === "simple") {
      var koPoint = boardState.koPoint;
      isKoViolation = koPoint && koPoint.y === y && koPoint.x === x;
    } else {
      (function () {
        var newState = boardState.playAt(y, x, color);
        var boardStates = existingStates;

        isKoViolation = existingStates.length > 0 && boardStates.some(function (existingState) {
          return existingState.positionSameAs(newState);
        });
      })();
    }

    return isKoViolation;
  },

  _wouldBeSuicide: function _wouldBeSuicide(y, x, color, boardState) {
    var intersection = boardState.intersectionAt(y, x);
    var surroundedEmptyPoint = intersection.isEmpty() && boardState.neighborsFor(intersection.y, intersection.x).filter(function (neighbor) {
      return neighbor.isEmpty();
    }).length === 0;

    if (!surroundedEmptyPoint) {
      return false;
    }

    var someFriendlyNotInAtari = boardState.neighborsFor(intersection.y, intersection.x).some(function (neighbor) {
      var inAtari = boardState.inAtari(neighbor.y, neighbor.x);
      var friendly = neighbor.isOccupiedWith(color);

      return friendly && !inAtari;
    });

    if (someFriendlyNotInAtari) {
      return false;
    }

    var someEnemyInAtari = boardState.neighborsFor(intersection.y, intersection.x).some(function (neighbor) {
      var inAtari = boardState.inAtari(neighbor.y, neighbor.x);
      var enemy = !neighbor.isOccupiedWith(color);

      return enemy && inAtari;
    });

    if (someEnemyInAtari) {
      return false;
    }

    return true;
  }
};

exports.default = Ruleset;


},{}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _utils = require("./utils");

var _utils2 = _interopRequireDefault(_utils);

var _intersection = require("./intersection");

var _intersection2 = _interopRequireDefault(_intersection);

var _region = require("./region");

var _region2 = _interopRequireDefault(_region);

var _eyePoint = require("./eye-point");

var _eyePoint2 = _interopRequireDefault(_eyePoint);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var boardStateWithoutDeadPoints = function boardStateWithoutDeadPoints(game) {
  return game.currentState()._withoutIntersectionsMatching(function (i) {
    return game._isDeadAt(i.y, i.x);
  });
};

var boardStateWithoutNeutralPoints = function boardStateWithoutNeutralPoints(boardState) {
  var regions = _region2.default.allFor(boardState);
  var neutralRegions = regions.filter(function (r) {
    return r.isNeutral();
  });

  if (regions.length === 0 || neutralRegions.length === 0) {
    return boardState;
  }

  var replacements = {};

  neutralRegions.forEach(function (r) {
    var startingX = null;
    var startingY = null;

    r.intersections.forEach(function (intersection) {
      startingX = startingX || intersection.x;
      startingX = startingX || intersection.y;

      var manhattanDistance = Math.abs(intersection.y - startingY) + Math.abs(intersection.x - startingX);
      var replacementColor = ["black", "white"][manhattanDistance % 2];
      var replacement = new _intersection2.default(intersection.y, intersection.x, replacementColor);

      replacements[intersection.y] = replacements[intersection.y] || [];
      replacements[intersection.y][intersection.x] = replacement;
    });
  });

  var newPoints = boardState.intersections.map(function (i) {
    if (replacements[i.y] && replacements[i.y][i.x]) {
      return replacements[i.y][i.x];
    } else {
      return i;
    }
  });

  return boardState._withNewPoints(newPoints);
};

var boardStateWithClearFalseEyesFilled = function boardStateWithClearFalseEyesFilled(boardState) {
  var territoryRegions = _region2.default.allFor(boardState).filter(function (r) {
    return r.isTerritory();
  });
  var falseEyePoints = _utils2.default.flatMap(territoryRegions, function (r) {
    return r.intersections;
  }).filter(function (i) {
    return new _eyePoint2.default(boardState, i).isFalse();
  });

  var pointsNeighboringAtari = falseEyePoints.filter(function (i) {
    return boardState.neighborsFor(i.y, i.x).some(function (n) {
      return boardState.inAtari(n.y, n.x);
    });
  });
  var neutralAtariUpdatedState = boardState;

  var _loop = function _loop() {
    var newPoints = neutralAtariUpdatedState.intersections.map(function (i) {
      if (pointsNeighboringAtari.indexOf(i) > -1) {
        return new _intersection2.default(i.y, i.x, new _eyePoint2.default(neutralAtariUpdatedState, i).filledColor());
      } else {
        return i;
      }
    });
    neutralAtariUpdatedState = neutralAtariUpdatedState._withNewPoints(newPoints);

    var boardState = boardStateWithoutNeutralPoints(neutralAtariUpdatedState);
    var territoryRegions = _region2.default.allFor(boardState).filter(function (r) {
      return r.isTerritory();
    });
    var falseEyePoints = _utils2.default.flatMap(territoryRegions, function (r) {
      return r.intersections;
    }).filter(function (i) {
      return new _eyePoint2.default(boardState, i).isFalse();
    });

    pointsNeighboringAtari = falseEyePoints.filter(function (i) {
      return neutralAtariUpdatedState.neighborsFor(i.y, i.x).some(function (n) {
        return neutralAtariUpdatedState.inAtari(n.y, n.x);
      });
    });
  };

  while (pointsNeighboringAtari.length > 0) {
    _loop();
  }

  return neutralAtariUpdatedState;
};

var TerritoryScoring = Object.freeze({
  score: function score(game) {
    var blackDeadAsCaptures = game.deadStones().filter(function (deadPoint) {
      return game.intersectionAt(deadPoint.y, deadPoint.x).isBlack();
    });
    var whiteDeadAsCaptures = game.deadStones().filter(function (deadPoint) {
      return game.intersectionAt(deadPoint.y, deadPoint.x).isWhite();
    });

    var territory = game.territory();
    var boardState = game.currentState();

    return {
      black: territory.black.length + boardState.whiteStonesCaptured + whiteDeadAsCaptures.length,
      white: territory.white.length + boardState.blackStonesCaptured + blackDeadAsCaptures.length
    };
  },

  territory: function territory(game) {
    var stateWithoutDeadPoints = boardStateWithoutDeadPoints(game);
    var stateWithoutNeutrals = boardStateWithoutNeutralPoints(stateWithoutDeadPoints);
    var stateWithClearFalseEyesFilled = boardStateWithClearFalseEyesFilled(stateWithoutNeutrals);

    var territoryRegions = _region2.default.allFor(stateWithClearFalseEyesFilled).filter(function (r) {
      return r.isTerritory();
    });

    var territoryRegionsWithoutSeki = territoryRegions.filter(function (r) {
      var merged = _region2.default.merge(territoryRegions, r);
      var eyeCounts = merged.map(function (m) {
        return Math.ceil(m.numberOfEyes());
      });

      return eyeCounts.length > 0 && eyeCounts.reduce(function (a, b) {
        return a + b;
      }) >= 2;
    });

    var blackRegions = territoryRegionsWithoutSeki.filter(function (r) {
      return r.isBlack();
    });
    var whiteRegions = territoryRegionsWithoutSeki.filter(function (r) {
      return r.isWhite();
    });

    return {
      black: _utils2.default.flatMap(blackRegions, function (r) {
        return r.intersections;
      }).map(function (i) {
        return { y: i.y, x: i.x };
      }),
      white: _utils2.default.flatMap(whiteRegions, function (r) {
        return r.intersections;
      }).map(function (i) {
        return { y: i.y, x: i.x };
      })
    };
  }
});

var AreaScoring = Object.freeze({
  score: function score(game) {
    var blackStonesOnTheBoard = game.intersections().filter(function (intersection) {
      return intersection.isBlack() && !game._isDeadAt(intersection.y, intersection.x);
    });
    var whiteStonesOnTheBoard = game.intersections().filter(function (intersection) {
      return intersection.isWhite() && !game._isDeadAt(intersection.y, intersection.x);
    });
    var territory = game.territory();

    return {
      black: territory.black.length + blackStonesOnTheBoard.length,
      white: territory.white.length + whiteStonesOnTheBoard.length
    };
  },

  territory: function territory(game) {
    var regions = _region2.default.allFor(boardStateWithoutDeadPoints(game));
    var territoryRegions = regions.filter(function (r) {
      return r.isTerritory();
    });
    var blackRegions = territoryRegions.filter(function (r) {
      return r.isBlack();
    });
    var whiteRegions = territoryRegions.filter(function (r) {
      return r.isWhite();
    });

    return {
      black: _utils2.default.flatMap(blackRegions, function (r) {
        return r.intersections;
      }).map(function (i) {
        return { y: i.y, x: i.x };
      }),
      white: _utils2.default.flatMap(whiteRegions, function (r) {
        return r.intersections;
      }).map(function (i) {
        return { y: i.y, x: i.x };
      })
    };
  }
});

var Scorer = function Scorer() {
  var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  var scoreBy = _ref.scoreBy;
  var komi = _ref.komi;

  this._strategy = {
    "area": AreaScoring,
    "territory": TerritoryScoring,
    "equivalence": AreaScoring
  }[scoreBy];

  this._komi = komi;

  if (!this._strategy) {
    throw new Error("Unknown scoring type: " + scoreBy);
  }

  if (this._komi === null || typeof this._komi === "undefined") {
    throw new Error("Error initializing scorer without a komi value");
  }

  if (typeof this._komi !== "number") {
    throw new Error("Komi value given is not a number: " + komi);
  }

  this._usePassStones = scoreBy === "equivalence";

  Object.freeze(this);
};

Scorer.prototype = {
  score: function score(game) {
    var result = this._strategy.score(game);
    result.white += this._komi;

    if (this._usePassStones) {
      return {
        black: result.black + game.currentState().whitePassStones,
        white: result.white + game.currentState().blackPassStones
      };
    } else {
      return result;
    }
  },

  territory: function territory(game) {
    return this._strategy.territory(game);
  },

  usingPassStones: function usingPassStones() {
    return this._usePassStones;
  }
};

exports.default = Scorer;


},{"./eye-point":5,"./intersection":7,"./region":9,"./utils":14}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _utils = require("./utils");

var _utils2 = _interopRequireDefault(_utils);

var _renderer = require("./renderer");

var _renderer2 = _interopRequireDefault(_renderer);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var SVGRenderer = function SVGRenderer(boardElement, _ref) {
  var hooks = _ref.hooks;
  var options = _ref.options;

  _renderer2.default.call(this, boardElement, { hooks: hooks, options: options });
  _utils2.default.addClass(boardElement, "tenuki-svg-renderer");
};

SVGRenderer.prototype = Object.create(_renderer2.default.prototype);
SVGRenderer.prototype.constructor = SVGRenderer;

SVGRenderer.prototype.generateBoard = function (boardState) {
  var _this = this;

  var renderer = this;
  var zoomContainer = renderer.zoomContainer;

  var svg = _utils2.default.createSVGElement("svg");
  renderer.svgElement = svg;

  var defs = _utils2.default.createSVGElement("defs");
  _utils2.default.appendElement(svg, defs);

  renderer.blackGradientID = _utils2.default.randomID("black-gradient");
  renderer.whiteGradientID = _utils2.default.randomID("white-gradient");

  var blackGradient = _utils2.default.createSVGElement("radialGradient", {
    attributes: {
      id: renderer.blackGradientID,
      cy: "0",
      r: "55%"
    }
  });
  _utils2.default.appendElement(blackGradient, _utils2.default.createSVGElement("stop", {
    attributes: {
      offset: "0%",
      "stop-color": "#848484"
    }
  }));
  _utils2.default.appendElement(blackGradient, _utils2.default.createSVGElement("stop", {
    attributes: {
      offset: "100%",
      "stop-color": "hsl(0, 0%, 20%)"
    }
  }));
  _utils2.default.appendElement(defs, blackGradient);

  var whiteGradient = _utils2.default.createSVGElement("radialGradient", {
    attributes: {
      id: renderer.whiteGradientID,
      cy: "0",
      r: "70%"
    }
  });
  _utils2.default.appendElement(whiteGradient, _utils2.default.createSVGElement("stop", {
    attributes: {
      offset: "0%",
      "stop-color": "white"
    }
  }));
  _utils2.default.appendElement(whiteGradient, _utils2.default.createSVGElement("stop", {
    attributes: {
      offset: "100%",
      "stop-color": "#DDDDDD"
    }
  }));
  _utils2.default.appendElement(defs, whiteGradient);

  var contentsContainer = _utils2.default.createSVGElement("g", {
    attributes: {
      class: "contents",
      transform: "translate(" + this.MARGIN + ", " + this.MARGIN + ")"
    }
  });

  var lines = _utils2.default.createSVGElement("g", {
    attributes: {
      class: "lines"
    }
  });
  _utils2.default.appendElement(contentsContainer, lines);

  for (var y = 0; y < boardState.boardSize - 1; y++) {
    for (var x = 0; x < boardState.boardSize - 1; x++) {
      var lineBox = _utils2.default.createSVGElement("rect", {
        attributes: {
          y: y * (this.INTERSECTION_GAP_SIZE + 1) - 0.5,
          x: x * (this.INTERSECTION_GAP_SIZE + 1) - 0.5,
          width: this.INTERSECTION_GAP_SIZE + 1,
          height: this.INTERSECTION_GAP_SIZE + 1,
          class: "line-box"
        }
      });

      _utils2.default.appendElement(lines, lineBox);
    }
  }

  var hoshiPoints = _utils2.default.createSVGElement("g", { attributes: { class: "hoshi" } });
  _utils2.default.appendElement(contentsContainer, hoshiPoints);

  _renderer2.default.hoshiPositionsFor(boardState.boardSize).forEach(function (h) {
    var hoshi = _utils2.default.createSVGElement("circle", {
      attributes: {
        class: "hoshi",
        cy: h.top * (_this.INTERSECTION_GAP_SIZE + 1) - 0.5,
        cx: h.left * (_this.INTERSECTION_GAP_SIZE + 1) - 0.5,
        r: 2
      }
    });

    _utils2.default.appendElement(hoshiPoints, hoshi);
  });

  var intersections = _utils2.default.createSVGElement("g", { attributes: { class: "intersections" } });
  _utils2.default.appendElement(contentsContainer, intersections);

  if (this.hasCoordinates) {
    (function () {
      var coordinateContainer = _utils2.default.createSVGElement("g", {
        attributes: {
          class: "coordinates",
          transform: "translate(" + _this.MARGIN + ", " + _this.MARGIN + ")"
        }
      });

      var _loop = function _loop(_y) {
        if (_this.hasCoordinates) {
          // TODO: 16 is for the rendered height _on my browser_. not reliable...

          [16 / 2 + 1 - (16 + 16 / 2 + 16 / (2 * 2) + 16 / (2 * 2 * 2)), 16 / 2 + 1 + (16 + 16 / 2) + (boardState.boardSize - 1) * (_this.INTERSECTION_GAP_SIZE + 1)].forEach(function (verticalOffset) {
            _utils2.default.appendElement(coordinateContainer, _utils2.default.createSVGElement("text", {
              text: boardState.xCoordinateFor(_y),
              attributes: {
                "text-anchor": "middle",
                y: verticalOffset - 0.5,
                x: _y * (_this.INTERSECTION_GAP_SIZE + 1) - 0.5
              }
            }));
          });

          [-1 * (16 + 16 / 2 + 16 / (2 * 2)), 16 + 16 / 2 + 16 / (2 * 2) + (boardState.boardSize - 1) * (_this.INTERSECTION_GAP_SIZE + 1)].forEach(function (horizontalOffset) {
            _utils2.default.appendElement(coordinateContainer, _utils2.default.createSVGElement("text", {
              text: boardState.yCoordinateFor(_y),
              attributes: {
                "text-anchor": "middle",
                y: _y * (_this.INTERSECTION_GAP_SIZE + 1) - 0.5 + 16 / (2 * 2),
                x: horizontalOffset - 0.5
              }
            }));
          });

          _utils2.default.appendElement(svg, coordinateContainer);
        }
      };

      for (var _y = 0; _y < boardState.boardSize; _y++) {
        _loop(_y);
      }
    })();
  }

  for (var _y2 = 0; _y2 < boardState.boardSize; _y2++) {
    for (var _x = 0; _x < boardState.boardSize; _x++) {
      var intersectionGroup = _utils2.default.createSVGElement("g", {
        attributes: {
          class: "intersection"
        }
      });
      _utils2.default.appendElement(intersections, intersectionGroup);

      var intersectionInnerContainer = _utils2.default.createSVGElement("g", {
        attributes: {
          class: "intersection-inner-container"
        }
      });
      _utils2.default.appendElement(intersectionGroup, intersectionInnerContainer);

      var intersectionBox = _utils2.default.createSVGElement("rect", {
        attributes: {
          y: _y2 * (this.INTERSECTION_GAP_SIZE + 1) - this.INTERSECTION_GAP_SIZE / 2 - 0.5,
          x: _x * (this.INTERSECTION_GAP_SIZE + 1) - this.INTERSECTION_GAP_SIZE / 2 - 0.5,
          width: this.INTERSECTION_GAP_SIZE,
          height: this.INTERSECTION_GAP_SIZE
        }
      });
      _utils2.default.appendElement(intersectionInnerContainer, intersectionBox);

      var stoneRadius = this.INTERSECTION_GAP_SIZE / 2;

      if (this.smallerStones) {
        stoneRadius -= 1;
      }

      var stoneAttributes = {
        class: "stone",
        cy: _y2 * (this.INTERSECTION_GAP_SIZE + 1) - 0.5,
        cx: _x * (this.INTERSECTION_GAP_SIZE + 1) - 0.5,
        width: this.INTERSECTION_GAP_SIZE + 1,
        height: this.INTERSECTION_GAP_SIZE + 1,
        r: stoneRadius
      };

      if (this.texturedStones) {
        _utils2.default.appendElement(intersectionInnerContainer, _utils2.default.createSVGElement("circle", {
          attributes: {
            class: "stone-shadow",
            cy: stoneAttributes["cy"] + 2,
            cx: stoneAttributes["cx"],
            width: stoneAttributes["width"],
            height: stoneAttributes["height"],
            r: stoneRadius
          }
        }));
      }

      var intersection = _utils2.default.createSVGElement("circle", {
        attributes: stoneAttributes
      });
      _utils2.default.appendElement(intersectionInnerContainer, intersection);

      _utils2.default.appendElement(intersectionInnerContainer, _utils2.default.createSVGElement("circle", {
        attributes: {
          class: "marker",
          cy: _y2 * (this.INTERSECTION_GAP_SIZE + 1) - 0.5,
          cx: _x * (this.INTERSECTION_GAP_SIZE + 1) - 0.5,
          width: this.INTERSECTION_GAP_SIZE + 1,
          height: this.INTERSECTION_GAP_SIZE + 1,
          r: 4.5
        }
      }));

      _utils2.default.appendElement(intersectionInnerContainer, _utils2.default.createSVGElement("rect", {
        attributes: {
          class: "ko-marker",
          y: _y2 * (this.INTERSECTION_GAP_SIZE + 1) - 6 - 0.5,
          x: _x * (this.INTERSECTION_GAP_SIZE + 1) - 6 - 0.5,
          width: 12,
          height: 12
        }
      }));

      _utils2.default.appendElement(intersectionInnerContainer, _utils2.default.createSVGElement("rect", {
        attributes: {
          class: "territory-marker",
          y: _y2 * (this.INTERSECTION_GAP_SIZE + 1) - 6,
          x: _x * (this.INTERSECTION_GAP_SIZE + 1) - 6,
          width: 11,
          height: 11
        }
      }));

      this.grid[_y2] = this.grid[_y2] || [];
      this.grid[_y2][_x] = intersectionGroup;

      this.addIntersectionEventListeners(intersectionGroup, _y2, _x);
    }
  }

  _utils2.default.appendElement(svg, contentsContainer);
  _utils2.default.appendElement(zoomContainer, svg);

  renderer.svgElement.setAttribute("height", renderer.BOARD_LENGTH);
  renderer.svgElement.setAttribute("width", renderer.BOARD_LENGTH);
};

SVGRenderer.prototype.setIntersectionClasses = function (intersectionEl, intersection, classes) {
  if (intersectionEl.getAttribute("class") !== classes.join(" ")) {
    intersectionEl.setAttribute("class", classes.join(" "));
  }

  if (this.texturedStones) {
    if (intersection.isEmpty()) {
      intersectionEl.querySelector(".stone").setAttribute("style", "");
    } else {
      intersectionEl.querySelector(".stone").setAttribute("style", "fill: url(#" + this[intersection.value + "GradientID"] + ")");
    }
  }
};

exports.default = SVGRenderer;


},{"./renderer":10,"./utils":14}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {
  flatten: function flatten(ary) {
    return ary.reduce(function (a, b) {
      return a.concat(b);
    });
  },

  flatMap: function flatMap(ary, lambda) {
    return Array.prototype.concat.apply([], ary.map(lambda));
  },

  cartesianProduct: function cartesianProduct(ary1, ary2) {
    return this.flatten(ary1.map(function (x) {
      return ary2.map(function (y) {
        return [x, y];
      });
    }));
  },

  randomID: function randomID(prefix) {
    var str = [0, 1, 2, 3].map(function () {
      return Math.floor(Math.random() * 0x10000).toString(16).substring(1);
    }).join("");

    return prefix + "-" + str;
  },

  createElement: function createElement(elementName, options) {
    var element = document.createElement(elementName);

    if (typeof options !== "undefined") {
      if (options.class) {
        element.className = options.class;
      }
    }

    return element;
  },

  createSVGElement: function createSVGElement(elementName, options) {
    var _this = this;

    var svgNamespace = "http://www.w3.org/2000/svg";
    var element = document.createElementNS(svgNamespace, elementName);

    if (typeof options !== "undefined") {
      if (options.class) {
        options.class.split(" ").forEach(function (name) {
          _this.addClass(element, name);
        });
      }

      if (options.attributes) {
        Object.keys(options.attributes).forEach(function (k) {
          element.setAttribute(k, options.attributes[k]);
        });
      }

      if (options.text) {
        element.textContent = options.text.toString();
      }
    }

    return element;
  },

  appendElement: function appendElement(parent, el) {
    parent.insertBefore(el, null);
  },

  addEventListener: function addEventListener(el, eventName, fn) {
    el.addEventListener(eventName, fn, false);
  },

  removeClass: function removeClass(el, className) {
    if (el.classList && el.classList.remove) {
      el.classList.remove(className);
      return;
    }

    var classNameRegex = RegExp('\\b' + className + '\\b', "g");

    if (el instanceof SVGElement) {
      el.setAttribute("class", el.getAttribute("class").replace(classNameRegex, ""));
    } else {
      el.className = el.getAttribute("class").replace(classNameRegex, "");
    }
  },

  addClass: function addClass(el, className) {
    if (el.classList && el.classList.add) {
      el.classList.add(className);
      return;
    }

    if (el instanceof SVGElement) {
      el.setAttribute("class", el.getAttribute("class") + " " + className);
    } else {
      el.className = el.getAttribute("class") + " " + className;
    }
  },

  hasClass: function hasClass(el, className) {
    if (el.classList && el.classList.contains) {
      return el.classList.contains(className);
    }

    var classNameRegex = RegExp('\\b' + className + '\\b', "g");

    if (el instanceof SVGElement) {
      return classNameRegex.test(el.getAttribute("class"));
    } else {
      return classNameRegex.test(el.className);
    }
  },

  toggleClass: function toggleClass(el, className) {
    if (el.classList && el.classList.toggle) {
      el.classList.toggle(className);
      return;
    }

    if (this.hasClass(el, className)) {
      this.removeClass(el, className);
    } else {
      this.addClass(el, className);
    }
  },

  unique: function unique(ary) {
    var unique = [];
    ary.forEach(function (el) {
      if (unique.indexOf(el) < 0) {
        unique.push(el);
      }
    });
    return unique;
  }
};


},{}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var cache = {};

function initialBitstringFor(size, y, x, value) {
  cache[size] = cache[size] || {};
  cache[size][y] = cache[size][y] || {};
  cache[size][y][x] = cache[size][y][x] || {};

  if (cache[size][y][x][value]) {
    return cache[size][y][x][value];
  }

  // The number of legal 19x19 go moves is on the order of 10^170 ≈ 2^565, so
  // a hash output on the order of 2^31 is woefully insufficient for arbitrary
  // positions, but it should be good enough for human play, since we're not
  // searching the entire space. This should be good enough for ~300-move games.
  var randomValue = Math.floor(Math.random() * (Math.pow(2, 31) - 1));
  cache[size][y][x][value] = randomValue;

  return randomValue;
}

exports.default = {
  hash: function hash(boardSize, intersections) {
    var h = 0;

    intersections.forEach(function (i) {
      if (!i.isEmpty()) {
        var initial = initialBitstringFor(boardSize, i.y, i.x, i.value);
        h = h ^ initial;
      }
    });

    return h;
  }
};


},{}]},{},[1])(1)
});