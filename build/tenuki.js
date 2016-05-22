/*!
 * tenuki v0.1.0 (https://github.com/aprescott/tenuki.js)
 * Copyright © 2016 Adam Prescott.
 * Licensed under the MIT license.
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.tenuki = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

exports.Game = require("./lib/game").default;
exports.utils = require("./lib/utils").default;

},{"./lib/game":5,"./lib/utils":11}],2:[function(require,module,exports){
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

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var BoardState = function BoardState(_ref) {
  var moveNumber = _ref.moveNumber;
  var playedPoint = _ref.playedPoint;
  var color = _ref.color;
  var pass = _ref.pass;
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
  this.intersections = intersections;
  this.blackStonesCaptured = blackStonesCaptured;
  this.whiteStonesCaptured = whiteStonesCaptured;
  this.capturedPositions = capturedPositions;
  this.koPoint = koPoint;
  this.boardSize = boardSize;

  Object.freeze(this);
};

BoardState.prototype = {
  _nextColor: function _nextColor() {
    if (this.color === "white") {
      return "black";
    } else {
      return "white";
    }
  },

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
      intersections: newPoints,
      blackStonesCaptured: this.blackStonesCaptured,
      whiteStonesCaptured: this.whiteStonesCaptured,
      capturedPositions: this.capturedPositions,
      koPoint: this.koPoint,
      boardSize: this.boardSize
    });

    return newState;
  },

  playPass: function playPass() {
    var newState = new BoardState({
      moveNumber: this.moveNumber + 1,
      playedPoint: null,
      color: this._nextColor(),
      pass: true,
      intersections: this.intersections,
      blackStonesCaptured: this.blackStonesCaptured,
      whiteStonesCaptured: this.whiteStonesCaptured,
      capturedPositions: [],
      koPoint: null,
      boardSize: this.boardSize
    });

    return newState;
  },

  playAt: function playAt(y, x) {
    var _this2 = this;

    var playedColor = this._nextColor();
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

  wouldBeSuicide: function wouldBeSuicide(y, x) {
    var _this4 = this;

    var intersection = this.intersectionAt(y, x);
    var surroundedEmptyPoint = intersection.isEmpty() && this.neighborsFor(intersection.y, intersection.x).filter(function (neighbor) {
      return neighbor.isEmpty();
    }).length === 0;

    if (!surroundedEmptyPoint) {
      return false;
    }

    var someFriendlyNotInAtari = this.neighborsFor(intersection.y, intersection.x).some(function (neighbor) {
      var inAtari = _this4.inAtari(neighbor.y, neighbor.x);
      var friendly = neighbor.isOccupiedWith(_this4._nextColor());

      return friendly && !inAtari;
    });

    if (someFriendlyNotInAtari) {
      return false;
    }

    var someEnemyInAtari = this.neighborsFor(intersection.y, intersection.x).some(function (neighbor) {
      var inAtari = _this4.inAtari(neighbor.y, neighbor.x);
      var enemy = !neighbor.isOccupiedWith(_this4._nextColor());

      return enemy && inAtari;
    });

    if (someEnemyInAtari) {
      return false;
    }

    return true;
  },

  samePositionAs: function samePositionAs(otherState) {
    return this.intersections.every(function (point) {
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
    boardSize: boardSize
  });

  this._cache[boardSize][handicapStones] = initialState;
  return initialState;
};

exports.default = BoardState;


},{"./intersection":6,"./utils":11}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = DOMRenderer;

var _utils = require("./utils");

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function DOMRenderer(game, boardElement) {
  this.INTERSECTION_GAP_SIZE = 28;
  this.GUTTER_MARGIN = this.INTERSECTION_GAP_SIZE - 3;
  this.BASE_MARGIN = this.INTERSECTION_GAP_SIZE - 10;
  this.MARGIN = boardElement.hasAttribute("data-include-coordinates") ? this.BASE_MARGIN + this.GUTTER_MARGIN : this.BASE_MARGIN;
  this.game = game;
  this.boardElement = boardElement;
  this.grid = [];
  this._touchEventFired = false;

  this.setup = function () {
    var renderer = this;
    var game = renderer.game;
    var boardElement = this.boardElement;

    var innerContainer = _utils2.default.createElement("div", { class: "tenuki-inner-container" });
    renderer.innerContainer = innerContainer;
    _utils2.default.appendElement(boardElement, innerContainer);

    var zoomContainer = _utils2.default.createElement("div", { class: "tenuki-zoom-container" });
    renderer.zoomContainer = zoomContainer;
    _utils2.default.appendElement(innerContainer, zoomContainer);

    _utils2.default.appendElement(zoomContainer, _utils2.default.createElement("div", { class: "lines horizontal" }));
    _utils2.default.appendElement(zoomContainer, _utils2.default.createElement("div", { class: "lines vertical" }));
    _utils2.default.appendElement(zoomContainer, _utils2.default.createElement("div", { class: "hoshi-points" }));
    _utils2.default.appendElement(zoomContainer, _utils2.default.createElement("div", { class: "intersections" }));

    renderer.cancelZoomElement = _utils2.default.createElement("div", { class: "cancel-zoom" });
    var cancelZoomBackdrop = _utils2.default.createElement("div", { class: "cancel-zoom-backdrop" });
    _utils2.default.addEventListener(renderer.cancelZoomElement, "click", function () {
      renderer.zoomOut();
    });
    _utils2.default.addEventListener(cancelZoomBackdrop, "click", function () {
      renderer.zoomOut();
    });
    _utils2.default.appendElement(innerContainer, renderer.cancelZoomElement);
    _utils2.default.appendElement(innerContainer, cancelZoomBackdrop);

    if (game.boardSize < 7) {
      if (game.boardSize > 1 && game.boardSize % 2 === 1) {
        var hoshi = _utils2.default.createElement("div", { class: "hoshi" });
        hoshi.style.top = "calc(" + renderer.MARGIN + "px + " + (game.boardSize - 1) / 2 + "* " + (renderer.INTERSECTION_GAP_SIZE + 1) + "px - 2px)";
        hoshi.style.left = hoshi.style.top;

        _utils2.default.appendElement(boardElement.querySelector(".hoshi-points"), hoshi);
      } else {
        // no hoshi
      }
    } else {
        var hoshiOffset = game.boardSize > 11 ? 3 : 2;

        for (var hoshiY = 0; hoshiY < 3; hoshiY++) {
          for (var hoshiX = 0; hoshiX < 3; hoshiX++) {
            if ((game.boardSize === 7 || game.boardSize % 2 === 0) && (hoshiY === 1 || hoshiX === 1)) {
              continue;
            }

            var _hoshi = _utils2.default.createElement("div", { class: "hoshi" });

            if (hoshiY === 0) {
              _hoshi.style.top = "calc(" + renderer.MARGIN + "px + " + hoshiOffset + "* " + (renderer.INTERSECTION_GAP_SIZE + 1) + "px - 2px)";
            }

            if (hoshiY === 1) {
              _hoshi.style.top = "calc(" + renderer.MARGIN + "px + " + ((game.boardSize + 1) / 2 - 1) + "* " + (renderer.INTERSECTION_GAP_SIZE + 1) + "px - 2px)";
            }

            if (hoshiY === 2) {
              _hoshi.style.top = "calc(" + renderer.MARGIN + "px + " + (game.boardSize - hoshiOffset - 1) + "* " + (renderer.INTERSECTION_GAP_SIZE + 1) + "px - 2px)";
            }

            if (hoshiX === 0) {
              _hoshi.style.left = "calc(" + renderer.MARGIN + "px + " + hoshiOffset + "* " + (renderer.INTERSECTION_GAP_SIZE + 1) + "px - 2px)";
            }

            if (hoshiX === 1) {
              _hoshi.style.left = "calc(" + renderer.MARGIN + "px + " + ((game.boardSize + 1) / 2 - 1) + "* " + (renderer.INTERSECTION_GAP_SIZE + 1) + "px - 2px)";
            }

            if (hoshiX === 2) {
              _hoshi.style.left = "calc(" + renderer.MARGIN + "px + " + (game.boardSize - hoshiOffset - 1) + "* " + (renderer.INTERSECTION_GAP_SIZE + 1) + "px - 2px)";
            }

            _utils2.default.appendElement(boardElement.querySelector(".hoshi-points"), _hoshi);
          }
        }
      }

    for (var y = 0; y < game.boardSize; y++) {
      var horizontalLine = _utils2.default.createElement("div", { class: "line horizontal" });
      horizontalLine.setAttribute("data-left-gutter", game.yCoordinateFor(y));
      _utils2.default.appendElement(boardElement.querySelector(".lines.horizontal"), horizontalLine);

      var verticalLine = _utils2.default.createElement("div", { class: "line vertical" });
      verticalLine.setAttribute("data-top-gutter", game.xCoordinateFor(y));
      _utils2.default.appendElement(boardElement.querySelector(".lines.vertical"), verticalLine);

      for (var x = 0; x < game.boardSize; x++) {
        var intersectionElement = _utils2.default.createElement("div", { class: "intersection empty" });
        var highlightElement = _utils2.default.createElement("div", { class: "highlight" });
        _utils2.default.appendElement(intersectionElement, highlightElement);

        intersectionElement.setAttribute("data-position-x", x);
        intersectionElement.setAttribute("data-position-y", y);
        intersectionElement.game = game;

        intersectionElement.style.left = x * (renderer.INTERSECTION_GAP_SIZE + 1) + "px";
        intersectionElement.style.top = y * (renderer.INTERSECTION_GAP_SIZE + 1) + "px";

        _utils2.default.appendElement(boardElement.querySelector(".intersections"), intersectionElement);

        renderer.grid[y] = renderer.grid[y] || [];
        renderer.grid[y][x] = intersectionElement;
      }
    }

    // prevent the text-selection cursor
    _utils2.default.addEventListener(boardElement.querySelector(".lines.horizontal"), "mousedown", function (e) {
      e.preventDefault();
    });
    _utils2.default.addEventListener(boardElement.querySelector(".lines.vertical"), "mousedown", function (e) {
      e.preventDefault();
    });

    boardElement.querySelector(".lines.horizontal").style.width = renderer.INTERSECTION_GAP_SIZE * (game.boardSize - 1) + game.boardSize + "px";
    boardElement.querySelector(".lines.horizontal").style.height = renderer.INTERSECTION_GAP_SIZE * (game.boardSize - 1) + game.boardSize + "px";
    boardElement.querySelector(".lines.vertical").style.width = renderer.INTERSECTION_GAP_SIZE * (game.boardSize - 1) + game.boardSize + "px";
    boardElement.querySelector(".lines.vertical").style.height = renderer.INTERSECTION_GAP_SIZE * (game.boardSize - 1) + game.boardSize + "px";

    var boardWidth = renderer.INTERSECTION_GAP_SIZE * (game.boardSize - 1) + game.boardSize + renderer.MARGIN * 2;
    var boardHeight = renderer.INTERSECTION_GAP_SIZE * (game.boardSize - 1) + game.boardSize + renderer.MARGIN * 2;

    innerContainer.style.width = boardWidth + "px";
    innerContainer.style.height = boardHeight + "px";

    zoomContainer.style.width = boardWidth + "px";
    zoomContainer.style.height = boardHeight + "px";

    _utils2.default.flatten(renderer.grid).forEach(function (intersectionEl) {
      _utils2.default.addEventListener(intersectionEl, "touchstart", function () {
        renderer._touchEventFired = true;
      });

      _utils2.default.addEventListener(intersectionEl, "mouseenter", function () {
        var intersectionElement = this;

        _utils2.default.addClass(intersectionElement, "hovered");
      });

      _utils2.default.addEventListener(intersectionEl, "mouseleave", function () {
        var intersectionElement = this;

        _utils2.default.removeClass(intersectionElement, "hovered");
        renderer.resetTouchedPoint();
      });

      _utils2.default.addEventListener(intersectionEl, "click", function () {
        var intersectionElement = this;
        var playedYPosition = Number(intersectionElement.getAttribute("data-position-y"));
        var playedXPosition = Number(intersectionElement.getAttribute("data-position-x"));

        var playOrToggleDead = function playOrToggleDead() {
          if (game.isOver()) {
            game.toggleDeadAt(playedYPosition, playedXPosition);
          } else {
            game.playAt(playedYPosition, playedXPosition);
          }
        };

        // if this isn't part of a touch,
        // or it is and the user is zoomed in,
        // or it's game over and we're marking stones dead,
        // then don't use the zoom/double-select system.
        if (!renderer._touchEventFired || document.body.clientWidth / window.innerWidth > 1 || game.isOver()) {
          playOrToggleDead();
          return;
        }

        if (renderer.touchedPoint) {
          if (intersectionElement === renderer.touchedPoint) {
            playOrToggleDead();
          } else {
            renderer.showPossibleMoveAt(intersectionElement);
          }
        } else {
          renderer.showPossibleMoveAt(intersectionElement);
        }
      });
    });

    var scaleX = innerContainer.parentNode.clientWidth / innerContainer.clientWidth;
    var scaleY = innerContainer.parentNode.clientHeight / innerContainer.clientHeight;
    var scale = Math.min(scaleX, scaleY);

    if (scale > 0 && scale < 1) {
      _utils2.default.addClass(boardElement, "tenuki-scaled");
      innerContainer.style["transform-origin"] = "top left";
      innerContainer.style.transform = "scale3d(" + scale + ", " + scale + ", 1)";

      // reset the outer element's height to match, ensuring that we free up any lingering whitespace
      boardElement.style.width = innerContainer.getBoundingClientRect().width + "px";
      boardElement.style.height = innerContainer.getBoundingClientRect().height + "px";
    }

    _utils2.default.addEventListener(boardElement, "touchstart", function (event) {
      if (event.touches.length > 1) {
        return;
      }

      if (!_utils2.default.hasClass(boardElement, "tenuki-zoomed")) {
        return;
      }

      var xCursor = event.changedTouches[0].clientX;
      var yCursor = event.changedTouches[0].clientY;

      renderer.dragStartX = xCursor - this.offsetLeft;
      renderer.dragStartY = yCursor - this.offsetTop;
      zoomContainer.style.transition = "none";
    });

    _utils2.default.addEventListener(innerContainer, "touchend", function (event) {
      if (event.touches.length > 1) {
        return;
      }

      if (!_utils2.default.hasClass(boardElement, "tenuki-zoomed")) {
        return;
      }

      zoomContainer.style.transition = "";

      if (!renderer.moveInProgress) {
        return;
      }
      renderer.translateY = renderer.lastTranslateY;
      renderer.translateX = renderer.lastTranslateX;
      renderer.moveInProgress = false;
    });

    _utils2.default.addEventListener(innerContainer, "touchmove", function (event) {
      if (event.touches.length > 1) {
        return;
      }

      if (!_utils2.default.hasClass(boardElement, "tenuki-zoomed")) {
        return true;
      }

      // prevent pull-to-refresh
      event.preventDefault();

      renderer.moveInProgress = true;

      var xCursor = event.changedTouches[0].clientX;
      var yCursor = event.changedTouches[0].clientY;

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

      zoomContainer.style.transform = "translate3d(" + 2.5 * translateX + "px, " + 2.5 * translateY + "px, 0) scale3d(2.5, 2.5, 1)";

      renderer.lastTranslateX = translateX;
      renderer.lastTranslateY = translateY;
    });
  };

  this.showPossibleMoveAt = function (intersectionElement) {
    var renderer = this;
    var boardElement = this.boardElement;
    var zoomContainer = this.zoomContainer;

    renderer.touchedPoint = intersectionElement;

    if (_utils2.default.hasClass(boardElement, "tenuki-scaled")) {
      var top = intersectionElement.offsetTop;
      var left = intersectionElement.offsetLeft;

      var translateY = 0.5 * zoomContainer.clientHeight - top - renderer.MARGIN;
      var translateX = 0.5 * zoomContainer.clientWidth - left - renderer.MARGIN;

      zoomContainer.style.transform = "translate3d(" + 2.5 * translateX + "px, " + 2.5 * translateY + "px, 0) scale3d(2.5, 2.5, 1)";
      renderer.translateY = translateY;
      renderer.translateX = translateX;

      _utils2.default.addClass(renderer.cancelZoomElement, "visible");
      _utils2.default.addClass(renderer.boardElement, "tenuki-zoomed");
    }
  };

  this.resetTouchedPoint = function () {
    var renderer = this;

    renderer.touchedPoint = null;
  };

  this.zoomOut = function () {
    var renderer = this;
    var zoomContainer = renderer.zoomContainer;

    this.resetTouchedPoint();
    zoomContainer.style.transform = "";
    zoomContainer.style.transition = "";
    renderer.dragStartX = null;
    renderer.dragStartY = null;
    renderer.translateY = null;
    renderer.translateX = null;
    renderer.lastTranslateX = null;
    renderer.lastTranslateY = null;

    _utils2.default.removeClass(renderer.cancelZoomElement, "visible");
    _utils2.default.removeClass(renderer.boardElement, "tenuki-zoomed");
  };

  this.render = function () {
    this.resetTouchedPoint();

    this.renderStonesPlayed();
    this.updateMarkerPoints();
    this.updateCurrentPlayer();

    if (this.game.isOver()) {
      this.renderTerritory();
    }
  };

  this.renderStonesPlayed = function () {
    var renderer = this;
    var points = renderer.game.intersections();

    points.forEach(function (intersection) {
      renderer.renderIntersection(intersection);
    });
  };

  this.updateMarkerPoints = function () {
    var renderer = this;
    var boardState = renderer.game.boardState();

    if (!boardState) {
      return;
    }

    renderer.game.intersections().forEach(function (intersection) {
      if (renderer.game.wouldBeSuicide(intersection.y, intersection.x)) {
        _utils2.default.addClass(renderer.grid[intersection.y][intersection.x], "suicide");
      }
    });

    if (boardState.koPoint) {
      _utils2.default.addClass(renderer.grid[boardState.koPoint.y][boardState.koPoint.x], "ko");
    }

    if (boardState.playedPoint) {
      _utils2.default.addClass(renderer.grid[boardState.playedPoint.y][boardState.playedPoint.x], "marker");
    }
  };

  this.updateCurrentPlayer = function () {
    var previousPlayer = this.game.boardState().color;
    _utils2.default.removeClass(boardElement, previousPlayer + "-to-play");
    _utils2.default.addClass(boardElement, this.game.currentPlayer() + "-to-play");

    if (this.game.isOver()) {
      _utils2.default.removeClass(boardElement, "black-to-play");
      _utils2.default.removeClass(boardElement, "white-to-play");
    }
  };

  this.renderIntersection = function (intersection) {
    var renderer = this;

    var intersectionEl = renderer.grid[intersection.y][intersection.x];

    var classes = ["intersection"];

    if (intersection.isEmpty()) {
      classes.push("empty");
    } else {
      classes.push("stone");

      if (intersection.isBlack()) {
        classes.push("black");
      } else {
        classes.push("white");
      }
    }

    if (intersectionEl.className !== classes.join(" ")) {
      intersectionEl.className = classes.join(" ");
    }
  };

  this.renderTerritory = function () {
    var _this = this;

    this.game.intersections().forEach(function (intersection) {
      _utils2.default.removeClass(_this.grid[intersection.y][intersection.x], "territory-black");
      _utils2.default.removeClass(_this.grid[intersection.y][intersection.x], "territory-white");

      if (_this.game.isDeadAt(intersection.y, intersection.x)) {
        _utils2.default.addClass(_this.grid[intersection.y][intersection.x], "dead");
      } else {
        _utils2.default.removeClass(_this.grid[intersection.y][intersection.x], "dead");
      }
    });

    var territory = this.game.territory();

    territory.black.forEach(function (territoryPoint) {
      _utils2.default.addClass(_this.grid[territoryPoint.y][territoryPoint.x], "territory-black");
    });

    territory.white.forEach(function (territoryPoint) {
      _utils2.default.addClass(_this.grid[territoryPoint.y][territoryPoint.x], "territory-white");
    });
  };
}


},{"./utils":11}],4:[function(require,module,exports){
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


},{}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _domRenderer = require("./dom-renderer");

var _domRenderer2 = _interopRequireDefault(_domRenderer);

var _nullRenderer = require("./null-renderer");

var _nullRenderer2 = _interopRequireDefault(_nullRenderer);

var _boardState = require("./board-state");

var _boardState2 = _interopRequireDefault(_boardState);

var _ruleset = require("./ruleset");

var _ruleset2 = _interopRequireDefault(_ruleset);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var VALID_GAME_OPTIONS = ["boardSize", "scoring", "handicapStones", "koRule"];

var Game = function Game(boardElement) {
  this._defaultBoardSize = 19;
  this.boardSize = null;
  this._moves = [];
  this.renderer = boardElement ? new _domRenderer2.default(this, boardElement) : new _nullRenderer2.default();
  this.callbacks = {
    postRender: function postRender() {}
  };
  this._deadPoints = [];
  this._defaultScoring = "territory";
  this._defaultKoRule = "simple";
};

Game.prototype = {
  _configureOptions: function _configureOptions() {
    var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var _ref$boardSize = _ref.boardSize;
    var boardSize = _ref$boardSize === undefined ? this._defaultBoardSize : _ref$boardSize;
    var _ref$handicapStones = _ref.handicapStones;
    var handicapStones = _ref$handicapStones === undefined ? 0 : _ref$handicapStones;
    var _ref$scoring = _ref.scoring;
    var scoring = _ref$scoring === undefined ? this._defaultScoring : _ref$scoring;
    var _ref$koRule = _ref.koRule;
    var koRule = _ref$koRule === undefined ? this._defaultKoRule : _ref$koRule;

    if (handicapStones > 0 && boardSize !== 9 && boardSize !== 13 && boardSize !== 19) {
      throw new Error("Handicap stones not supported on sizes other than 9x9, 13x13 and 19x19");
    }

    if (handicapStones < 0 || handicapStones === 1 || handicapStones > 9) {
      throw new Error("Only 2 to 9 handicap stones are supported");
    }

    this.boardSize = boardSize;
    this.handicapStones = handicapStones;
    this.ruleset = new _ruleset2.default({
      "scoring": scoring,
      "koRule": koRule
    });
  },

  setup: function setup(options) {
    for (var key in options) {
      if (options.hasOwnProperty(key) && VALID_GAME_OPTIONS.indexOf(key) < 0) {
        throw new Error("Unrecognized game option: " + key);
      }
    }

    this._configureOptions(options);

    if (this.boardSize > 19) {
      throw new Error("cannot generate a board size greater than 19");
    }

    this.renderer.setup();
    this.render();
  },

  intersectionAt: function intersectionAt(y, x) {
    return this.boardState().intersectionAt(y, x);
  },

  intersections: function intersections() {
    return this.boardState().intersections;
  },

  yCoordinateFor: function yCoordinateFor(y) {
    return this.boardSize - y;
  },

  xCoordinateFor: function xCoordinateFor(x) {
    var letters = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"];

    return letters[x];
  },

  coordinatesFor: function coordinatesFor(y, x) {
    return this.xCoordinateFor(x) + this.yCoordinateFor(y);
  },

  currentPlayer: function currentPlayer() {
    return this.boardState()._nextColor();
  },

  playAt: function playAt(y, x) {
    if (this.isIllegalAt(y, x)) {
      return false;
    }

    this._moves.push(this.boardState().playAt(y, x));
    this.render();

    return true;
  },

  boardState: function boardState() {
    return this._moves[this._moves.length - 1] || _boardState2.default._initialFor(this.boardSize, this.handicapStones);
  },

  isWhitePlaying: function isWhitePlaying() {
    return this.currentPlayer() === "white";
  },

  isBlackPlaying: function isBlackPlaying() {
    return this.currentPlayer() === "black";
  },

  inAtari: function inAtari(y, x) {
    return this.boardState().inAtari(y, x);
  },

  wouldBeSuicide: function wouldBeSuicide(y, x) {
    return this.boardState().wouldBeSuicide(y, x);
  },

  pass: function pass() {
    if (!this.isOver()) {
      this._moves.push(this.boardState().playPass());
      this.render();
    }
  },

  isOver: function isOver() {
    if (this._moves.length < 2) {
      return false;
    }

    var boardState = this.boardState();
    var previousMove = this._moves[this._moves.length - 2];

    return boardState.pass && previousMove.pass;
  },

  toggleDeadAt: function toggleDeadAt(y, x) {
    var _this = this;

    var alreadyDead = this.isDeadAt(y, x);

    this.groupAt(y, x).forEach(function (intersection) {
      if (alreadyDead) {
        _this._deadPoints = _this._deadPoints.filter(function (dead) {
          return !(dead.y === intersection.y && dead.x === intersection.x);
        });
      } else {
        _this._deadPoints.push({ y: intersection.y, x: intersection.x });
      }
    });

    this.render();
  },

  isDeadAt: function isDeadAt(y, x) {
    return this._deadPoints.some(function (dead) {
      return dead.y === y && dead.x === x;
    });
  },

  score: function score() {
    return this.ruleset.score(this);
  },

  libertiesAt: function libertiesAt(y, x) {
    return this.boardState().libertiesAt(y, x);
  },

  groupAt: function groupAt(y, x) {
    return this.boardState().groupAt(y, x);
  },

  neighborsFor: function neighborsFor(y, x) {
    return this.boardState().neighborsFor(y, x);
  },

  isIllegalAt: function isIllegalAt(y, x) {
    if (this._moves.length === 0) {
      return false;
    }

    return this.ruleset.isIllegal(y, x, this);
  },

  render: function render() {
    if (!this.isOver()) {
      this.removeScoringState();
    }

    this.renderer.render();
    this.callbacks.postRender(this);
  },

  removeScoringState: function removeScoringState() {
    this._deadPoints = [];
  },

  territory: function territory() {
    if (!this.isOver()) {
      return;
    }

    return this.ruleset.territory(this);
  },

  undo: function undo() {
    this._moves.pop();
    this.render();
  }
};

exports.default = Game;


},{"./board-state":2,"./dom-renderer":3,"./null-renderer":7,"./ruleset":9}],6:[function(require,module,exports){
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


},{}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = NullRenderer;
function NullRenderer() {
  this.setup = function () {};
  this.render = function () {};
}


},{}],8:[function(require,module,exports){
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


},{"./utils":11}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _scoring = require("./scoring");

var VALID_KO_OPTIONS = ["simple", "superko"];

var Ruleset = function Ruleset() {
  var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  var scoring = _ref.scoring;
  var koRule = _ref.koRule;

  this.scorer = {
    "area": _scoring.AreaScoring,
    "territory": _scoring.TerritoryScoring
  }[scoring];
  this.koRule = koRule;

  if (!this.scorer) {
    throw new Error("Unknown scoring: " + scoring);
  }

  if (VALID_KO_OPTIONS.indexOf(this.koRule) < 0) {
    throw new Error("Unknown ko rule: " + koRule);
  }

  Object.freeze(this);
};

Ruleset.prototype = {
  isIllegal: function isIllegal(y, x, game) {
    var boardState = game.boardState();
    var boardStates = game._moves;
    var intersection = boardState.intersectionAt(y, x);
    var isEmpty = intersection.isEmpty();
    var isSuicide = boardState.wouldBeSuicide(y, x);

    var isKoViolation = false;

    if (this.koRule === "simple") {
      var koPoint = boardState.koPoint;
      isKoViolation = koPoint && koPoint.y === y && koPoint.x === x;
    } else {
      (function () {
        var newState = boardState.playAt(y, x);
        isKoViolation = boardStates.slice().reverse().some(function (existingState) {
          return newState.samePositionAs(existingState);
        });
      })();
    }

    return !isEmpty || isKoViolation || isSuicide;
  },

  territory: function territory(game) {
    return this.scorer.territory(game);
  },

  score: function score(game) {
    return this.scorer.score(game);
  }
};

exports.default = Ruleset;


},{"./scoring":10}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AreaScoring = exports.TerritoryScoring = undefined;

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
  return game.boardState()._withoutIntersectionsMatching(function (i) {
    return game.isDeadAt(i.y, i.x);
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
    var blackDeadAsCaptures = game._deadPoints.filter(function (deadPoint) {
      return game.intersectionAt(deadPoint.y, deadPoint.x).isBlack();
    });
    var whiteDeadAsCaptures = game._deadPoints.filter(function (deadPoint) {
      return game.intersectionAt(deadPoint.y, deadPoint.x).isWhite();
    });

    var territory = game.territory();
    var boardState = game.boardState();

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
      return intersection.isBlack() && !game.isDeadAt(intersection.y, intersection.x);
    });
    var whiteStonesOnTheBoard = game.intersections().filter(function (intersection) {
      return intersection.isWhite() && !game.isDeadAt(intersection.y, intersection.x);
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

exports.TerritoryScoring = TerritoryScoring;
exports.AreaScoring = AreaScoring;


},{"./eye-point":4,"./intersection":6,"./region":8,"./utils":11}],11:[function(require,module,exports){
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

  createElement: function createElement(elementName, options) {
    var element = document.createElement(elementName);

    if (typeof options !== "undefined") {
      if (options.class) {
        element.className = options.class;
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
    el.classList.remove(className);
  },

  addClass: function addClass(el, className) {
    el.classList.add(className);
  },

  hasClass: function hasClass(el, className) {
    return el.classList.contains(className);
  },

  toggleClass: function toggleClass(el, className) {
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


},{}]},{},[1])(1)
});