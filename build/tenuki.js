/*!
 * tenuki v0.1.0 (https://github.com/aprescott/tenuki.js)
 * Copyright © 2016 Adam Prescott.
 * Licensed under the MIT license.
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.tenuki = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

exports.Game = require("./lib/game").default;
exports.utils = require("./lib/utils").default;

},{"./lib/game":4,"./lib/utils":8}],2:[function(require,module,exports){
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
  this.touchEventFired = false;

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
    _utils2.default.addEventListener(renderer.cancelZoomElement, "click", function (e) {
      renderer.zoomOut();
    });
    _utils2.default.addEventListener(cancelZoomBackdrop, "click", function (e) {
      renderer.zoomOut();
    });
    _utils2.default.appendElement(innerContainer, renderer.cancelZoomElement);
    _utils2.default.appendElement(innerContainer, cancelZoomBackdrop);

    if (game.boardSize < 7) {
      if (game.boardSize > 1 && game.boardSize % 2 == 1) {
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
            if ((game.boardSize == 7 || game.boardSize % 2 == 0) && (hoshiY == 1 || hoshiX == 1)) {
              continue;
            }

            var _hoshi = _utils2.default.createElement("div", { class: "hoshi" });

            if (hoshiY == 0) {
              _hoshi.style.top = "calc(" + renderer.MARGIN + "px + " + hoshiOffset + "* " + (renderer.INTERSECTION_GAP_SIZE + 1) + "px - 2px)";
            }

            if (hoshiY == 1) {
              _hoshi.style.top = "calc(" + renderer.MARGIN + "px + " + ((game.boardSize + 1) / 2 - 1) + "* " + (renderer.INTERSECTION_GAP_SIZE + 1) + "px - 2px)";
            }

            if (hoshiY == 2) {
              _hoshi.style.top = "calc(" + renderer.MARGIN + "px + " + (game.boardSize - hoshiOffset - 1) + "* " + (renderer.INTERSECTION_GAP_SIZE + 1) + "px - 2px)";
            }

            if (hoshiX == 0) {
              _hoshi.style.left = "calc(" + renderer.MARGIN + "px + " + hoshiOffset + "* " + (renderer.INTERSECTION_GAP_SIZE + 1) + "px - 2px)";
            }

            if (hoshiX == 1) {
              _hoshi.style.left = "calc(" + renderer.MARGIN + "px + " + ((game.boardSize + 1) / 2 - 1) + "* " + (renderer.INTERSECTION_GAP_SIZE + 1) + "px - 2px)";
            }

            if (hoshiX == 2) {
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

        renderer.grid[y] || (renderer.grid[y] = []);
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

    boardElement.querySelector(".lines.horizontal").style.width = renderer.INTERSECTION_GAP_SIZE * (game.boardSize - 1) + game.boardSize * 1 + "px";
    boardElement.querySelector(".lines.horizontal").style.height = renderer.INTERSECTION_GAP_SIZE * (game.boardSize - 1) + game.boardSize * 1 + "px";
    boardElement.querySelector(".lines.vertical").style.width = renderer.INTERSECTION_GAP_SIZE * (game.boardSize - 1) + game.boardSize * 1 + "px";
    boardElement.querySelector(".lines.vertical").style.height = renderer.INTERSECTION_GAP_SIZE * (game.boardSize - 1) + game.boardSize * 1 + "px";

    var boardWidth = renderer.INTERSECTION_GAP_SIZE * (game.boardSize - 1) + game.boardSize * 1 + renderer.MARGIN * 2;
    var boardHeight = renderer.INTERSECTION_GAP_SIZE * (game.boardSize - 1) + game.boardSize * 1 + renderer.MARGIN * 2;

    innerContainer.style.width = boardWidth + "px";
    innerContainer.style.height = boardHeight + "px";

    zoomContainer.style.width = boardWidth + "px";
    zoomContainer.style.height = boardHeight + "px";

    _utils2.default.flatten(renderer.grid).forEach(function (intersectionEl) {
      _utils2.default.addEventListener(intersectionEl, "touchstart", function () {
        renderer.touchEventFired = true;
      });

      _utils2.default.addEventListener(intersectionEl, "mouseenter", function () {
        var intersectionElement = this;

        _utils2.default.addClass(intersectionElement, "hovered");
      });

      _utils2.default.addEventListener(intersectionEl, "mouseleave", function () {
        var intersectionElement = this;

        _utils2.default.removeClass(intersectionElement, "hovered");
        game.renderer.resetTouchedPoint();
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
        if (!renderer.touchEventFired || document.body.clientWidth / window.innerWidth > 1 || game.isOver()) {
          playOrToggleDead();
          return;
        }

        if (renderer.touchedPoint) {
          if (intersectionElement == renderer.touchedPoint) {
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
    var innerContainer = this.innerContainer;
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
    var game = renderer.game;
    var currentMove = game.currentMove();
    var points = game.intersections();

    points.forEach(function (intersection) {
      renderer.renderIntersection(intersection);
    });
  };

  this.updateMarkerPoints = function () {
    var renderer = this;
    var game = this.game;
    var currentMove = game.currentMove();

    if (!currentMove) {
      return;
    }

    game.intersections().forEach(function (intersection) {
      if (game.wouldBeSuicide(intersection.y, intersection.x)) {
        _utils2.default.addClass(renderer.grid[intersection.y][intersection.x], "suicide");
      }
    });

    if (currentMove.koPoint) {
      _utils2.default.addClass(renderer.grid[currentMove.koPoint.y][currentMove.koPoint.x], "ko");
    }

    // TODO: this is awkward naming. it seems like currentState should be separate from currentMove?
    // but then you constantly have to check currentMove everywhere?
    // what if there were a flag that represented the presence of y and x?
    if (currentMove.y && currentMove.x) {
      _utils2.default.addClass(renderer.grid[currentMove.y][currentMove.x], "marker");
    }
  };

  this.updateCurrentPlayer = function () {
    var game = this.game;
    var previousPlayer = game.currentPlayer() == "black" ? "white" : "black";
    _utils2.default.removeClass(boardElement, previousPlayer + "-to-play");
    _utils2.default.addClass(boardElement, game.currentPlayer() + "-to-play");

    if (game.isOver()) {
      _utils2.default.removeClass(boardElement, "black-to-play");
      _utils2.default.removeClass(boardElement, "white-to-play");
    }
  };

  this.renderIntersection = function (intersection) {
    var renderer = this;
    var game = this.game;

    var intersectionEl = renderer.grid[intersection.y][intersection.x];
    intersectionEl.className = ""; // be clear that we're removing all classes
    _utils2.default.addClass(intersectionEl, "intersection");

    if (intersection.isEmpty()) {
      _utils2.default.addClass(intersectionEl, "empty");
    } else {
      _utils2.default.addClass(intersectionEl, "stone");

      if (intersection.isBlack()) {
        _utils2.default.addClass(intersectionEl, "black");
      } else {
        _utils2.default.addClass(intersectionEl, "white");
      }
    }
  };

  this.renderTerritory = function () {
    var renderer = this;
    var game = this.game;

    game.intersections().forEach(function (intersection) {
      _utils2.default.removeClass(renderer.grid[intersection.y][intersection.x], "territory-black");
      _utils2.default.removeClass(renderer.grid[intersection.y][intersection.x], "territory-white");

      if (game.isDeadAt(intersection.y, intersection.x)) {
        _utils2.default.addClass(renderer.grid[intersection.y][intersection.x], "dead");
      } else {
        _utils2.default.removeClass(renderer.grid[intersection.y][intersection.x], "dead");
      }
    });

    game.territory().black.forEach(function (territoryPoint) {
      _utils2.default.addClass(renderer.grid[territoryPoint.y][territoryPoint.x], "territory-black");
    });

    game.territory().white.forEach(function (territoryPoint) {
      _utils2.default.addClass(renderer.grid[territoryPoint.y][territoryPoint.x], "territory-white");
    });
  };
};


},{"./utils":8}],3:[function(require,module,exports){
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

var GameState = function GameState(_ref) {
  var y = _ref.y;
  var x = _ref.x;
  var color = _ref.color;
  var pass = _ref.pass;
  var points = _ref.points;
  var blackStonesCaptured = _ref.blackStonesCaptured;
  var whiteStonesCaptured = _ref.whiteStonesCaptured;
  var capturedPositions = _ref.capturedPositions;
  var koPoint = _ref.koPoint;
  var boardSize = _ref.boardSize;

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
  _nextColor: function _nextColor() {
    if (!this.color || this.color == "white") {
      return "black";
    } else {
      return "white";
    }
  },

  _capturesFrom: function _capturesFrom(y, x, color) {
    var _this = this;

    var point = this.intersectionAt(y, x);

    var capturedNeighbors = this.neighborsFor(point.y, point.x).filter(function (neighbor) {
      // TODO: this value of 1 is potentially weird.
      // we're checking against the move before the stone we just played
      // where this space is not occupied yet. things should possibly be
      // reworked.
      return !neighbor.isEmpty() && neighbor.value != color && _this.libertiesAt(neighbor.y, neighbor.x) == 1;
    });

    var capturedStones = _utils2.default.flatMap(capturedNeighbors, function (neighbor) {
      return _this.groupAt(neighbor.y, neighbor.x);
    });

    return capturedStones;
  },

  _updatePoint: function _updatePoint(intersection, points, color) {
    var index = points.indexOf(intersection);

    var prefix = points.slice(0, index);
    var newPoint = new _intersection2.default(intersection.y, intersection.x, color);
    var suffix = points.slice(index + 1);

    return prefix.concat([newPoint], suffix);
  },

  _removePoint: function _removePoint(intersection, points) {
    return this._updatePoint(intersection, points, "empty");
  },

  playPass: function playPass() {
    var newState = new GameState({
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

  playAt: function playAt(y, x, game) {
    var _this2 = this;

    var playedColor = this._nextColor();
    var capturedPositions = this._capturesFrom(y, x, playedColor);
    var playedPoint = this.intersectionAt(y, x);
    var newPoints = this.points;

    capturedPositions.forEach(function (i) {
      newPoints = _this2._removePoint(i, newPoints);
    });

    newPoints = this._updatePoint(playedPoint, newPoints, playedColor);

    var newTotalBlackCaptured = this.blackStonesCaptured + (playedColor == "black" ? 0 : capturedPositions.length);
    var newTotalWhiteCaptured = this.whiteStonesCaptured + (playedColor == "white" ? 0 : capturedPositions.length);

    var boardSize = this.boardSize;

    var moveInfo = {
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
    var hasKoPoint = capturedPositions.length == 1 && game.groupAt(y, x).length == 1 && game.inAtari(y, x);
    game.moves.pop();

    if (hasKoPoint) {
      moveInfo["koPoint"] = { y: capturedPositions[0].y, x: capturedPositions[0].x };
    } else {
      moveInfo["koPoint"] = null;
    }

    return new GameState(moveInfo);
  },

  intersectionAt: function intersectionAt(y, x) {
    return this.points[y * this.boardSize + x];
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

    // this is not great, but we need a representation that will be unique-able,
    // and Y-X does the job.
    return _utils2.default.unique(emptyPoints.map(function (emptyPoint) {
      return emptyPoint.y + "-" + emptyPoint.x;
    })).length;
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

    return [checkedPoints, boundaryPoints];
  },

  territory: function territory(game) {
    var emptyOrDeadPoints = this.points.filter(function (intersection) {
      return intersection.isEmpty() || game.isDeadAt(intersection.y, intersection.x);
    });

    if (emptyOrDeadPoints.length == 0) {
      return;
    }

    var checkedPoints = [];
    var territoryPoints = { black: [], white: [] };
    var pointsToCheck = emptyOrDeadPoints;

    while (pointsToCheck.length > 0) {
      var nextPoint = pointsToCheck.pop();
      checkedPoints = checkedPoints.concat(this.checkTerritoryStartingAt(game, nextPoint.y, nextPoint.x, territoryPoints));
      pointsToCheck = emptyOrDeadPoints.filter(function (i) {
        return checkedPoints.indexOf(i) < 0;
      });
    }

    return {
      black: territoryPoints.black.map(function (i) {
        return { y: i.y, x: i.x };
      }),
      white: territoryPoints.white.map(function (i) {
        return { y: i.y, x: i.x };
      })
    };
  },

  checkTerritoryStartingAt: function checkTerritoryStartingAt(game, y, x, territoryPoints) {
    var startingPoint = this.intersectionAt(y, x);

    var _partitionTraverse3 = this.partitionTraverse(startingPoint, function (neighbor) {
      return neighbor.isEmpty() || game.isDeadAt(neighbor.y, neighbor.x);
    });

    var _partitionTraverse4 = _slicedToArray(_partitionTraverse3, 2);

    var nonOccupiedPoints = _partitionTraverse4[0];
    var occupiedPoints = _partitionTraverse4[1];

    var surroundingColors = _utils2.default.unique(occupiedPoints.map(function (occupiedPoint) {
      return occupiedPoint.value;
    }));

    if (surroundingColors.length == 1 && surroundingColors[0] != "empty") {
      var territoryColor = surroundingColors[0];

      territoryPoints[territoryColor] = territoryPoints[territoryColor].concat(nonOccupiedPoints);
    }

    return nonOccupiedPoints;
  }
};

GameState.initialFor = function (game) {
  var emptyPoints = [];

  for (var y = 0; y < game.boardSize; y++) {
    for (var x = 0; x < game.boardSize; x++) {
      var intersection = new _intersection2.default(y, x);
      emptyPoints[y] || (emptyPoints[y] = []);
      emptyPoints[y][x] = intersection;
    }
  }

  return new GameState({
    points: Object.freeze(_utils2.default.flatten(emptyPoints)),
    blackStonesCaptured: 0,
    whiteStonesCaptured: 0,
    boardSize: game.boardSize
  });
};

exports.default = GameState;


},{"./intersection":5,"./utils":8}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _utils = require("./utils");

var _utils2 = _interopRequireDefault(_utils);

var _domRenderer = require("./dom-renderer");

var _domRenderer2 = _interopRequireDefault(_domRenderer);

var _nullRenderer = require("./null-renderer");

var _nullRenderer2 = _interopRequireDefault(_nullRenderer);

var _intersection = require("./intersection");

var _intersection2 = _interopRequireDefault(_intersection);

var _scorer = require("./scorer");

var _scorer2 = _interopRequireDefault(_scorer);

var _gameState = require("./game-state");

var _gameState2 = _interopRequireDefault(_gameState);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var Game = function Game(boardElement) {
  this._defaultBoardSize = 19;
  this.boardSize = null;
  this.moves = [];
  this.renderer = boardElement ? new _domRenderer2.default(this, boardElement) : new _nullRenderer2.default();
  this.callbacks = {
    postRender: function postRender() {}
  };
  this.deadPoints = [];
};

Game.prototype = {
  _configureOptions: function _configureOptions() {
    var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var _ref$boardSize = _ref.boardSize;
    var boardSize = _ref$boardSize === undefined ? this._defaultBoardSize : _ref$boardSize;

    this.boardSize = boardSize;
  },

  setup: function setup(options) {
    this._configureOptions(options);

    if (this.boardSize > 19) {
      throw "cannot generate a board size greater than 19";
    }

    this.renderer.setup();
    this.render();
  },

  intersectionAt: function intersectionAt(y, x) {
    return this.currentMove().intersectionAt(y, x);
  },

  intersections: function intersections() {
    return this.currentMove().points;
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
    return this.currentMove()._nextColor();
  },

  playAt: function playAt(y, x) {
    if (this.isIllegalAt(y, x)) {
      return false;
    }

    this.moves.push(this.currentMove().playAt(y, x, this));
    this.render();

    return true;
  },

  currentMove: function currentMove() {
    return this.moves[this.moves.length - 1] || _gameState2.default.initialFor(this);
  },

  isWhitePlaying: function isWhitePlaying() {
    return this.currentPlayer() == "white";
  },

  isBlackPlaying: function isBlackPlaying() {
    return this.currentPlayer() == "black";
  },

  inAtari: function inAtari(y, x) {
    return this.libertiesAt(y, x) == 1;
  },

  wouldBeSuicide: function wouldBeSuicide(y, x) {
    var _this = this;

    var intersection = this.intersectionAt(y, x);
    var surroundedEmptyPoint = intersection.isEmpty() && this.neighborsFor(intersection.y, intersection.x).filter(function (neighbor) {
      return neighbor.isEmpty();
    }).length == 0;

    if (!surroundedEmptyPoint) {
      return false;
    }

    var suicide = true;

    var friendlyNeighbors = this.neighborsFor(intersection.y, intersection.x).filter(function (neighbor) {
      return neighbor.isOccupiedWith(_this.currentPlayer());
    });

    var someFriendlyNotInAtari = this.neighborsFor(intersection.y, intersection.x).some(function (neighbor) {
      var inAtari = _this.inAtari(neighbor.y, neighbor.x);
      var friendly = neighbor.isOccupiedWith(_this.currentPlayer());

      return friendly && !inAtari;
    });

    if (someFriendlyNotInAtari) {
      suicide = false;
    }

    var someEnemyInAtari = this.neighborsFor(intersection.y, intersection.x).some(function (neighbor) {
      var inAtari = _this.inAtari(neighbor.y, neighbor.x);
      var enemy = !neighbor.isOccupiedWith(_this.currentPlayer());

      return enemy && inAtari;
    });

    if (someEnemyInAtari) {
      suicide = false;
    }

    return suicide;
  },

  pass: function pass() {
    if (!this.isOver()) {
      this.moves.push(this.currentMove().playPass());
      this.render();
    }
  },

  isOver: function isOver() {
    if (this.moves.length < 2) {
      return false;
    }

    var currentMove = this.currentMove();
    var previousMove = this.moves[this.moves.length - 2];

    return currentMove.pass && previousMove.pass;
  },

  toggleDeadAt: function toggleDeadAt(y, x) {
    var _this2 = this;

    var alreadyDead = this.isDeadAt(y, x);

    this.groupAt(y, x).forEach(function (intersection) {
      if (alreadyDead) {
        _this2.deadPoints = _this2.deadPoints.filter(function (dead) {
          return !(dead.y == intersection.y && dead.x == intersection.x);
        });
      } else {
        _this2.deadPoints.push({ y: intersection.y, x: intersection.x });
      }
    });

    this.render();
  },

  isDeadAt: function isDeadAt(y, x) {
    return this.deadPoints.some(function (dead) {
      return dead.y == y && dead.x == x;
    });
  },

  territoryScore: function territoryScore() {
    return _scorer2.default.territoryResultFor(this);
  },

  areaScore: function areaScore() {
    return _scorer2.default.areaResultFor(this);
  },

  libertiesAt: function libertiesAt(y, x) {
    return this.currentMove().libertiesAt(y, x);
  },

  groupAt: function groupAt(y, x) {
    return this.currentMove().groupAt(y, x);
  },

  neighborsFor: function neighborsFor(y, x) {
    return this.currentMove().neighborsFor(y, x);
  },

  hasCapturesFor: function hasCapturesFor(y, x) {
    var _this3 = this;

    var point = this.intersectionAt(y, x);

    var capturedNeighbors = this.neighborsFor(point.y, point.x).filter(function (neighbor) {
      return !neighbor.isEmpty && !neighbor.sameColorAs(point) && _this3.libertiesAt(neighbor.y, neighbor.x) == 0;
    });

    return capturedNeighbors.length > 0;
  },

  isIllegalAt: function isIllegalAt(y, x) {
    if (this.moves.length == 0) {
      return false;
    }

    var intersection = this.intersectionAt(y, x);
    var isEmpty = intersection.isEmpty();
    var isCapturing = this.hasCapturesFor(y, x);
    var isSuicide = this.wouldBeSuicide(y, x);
    var koPoint = this.currentMove().koPoint;
    var isKoViolation = koPoint && koPoint.y == y && koPoint.x == x;

    return !isEmpty || isKoViolation || isSuicide && !isCapturing;
  },

  render: function render() {
    var currentMove = this.currentMove();

    if (!this.isOver()) {
      this.removeScoringState();
    }

    this.renderer.render();
    this.callbacks.postRender(this);
  },

  removeScoringState: function removeScoringState() {
    this.deadPoints = [];
  },

  territory: function territory() {
    if (!this.isOver()) {
      return;
    }

    return this.currentMove().territory(this);
  },

  undo: function undo() {
    this.moves.pop();
    this.render();
  }
};

exports.default = Game;


},{"./dom-renderer":2,"./game-state":3,"./intersection":5,"./null-renderer":6,"./scorer":7,"./utils":8}],5:[function(require,module,exports){
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


},{}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = NullRenderer;
function NullRenderer() {
  this.setup = function () {};
  this.render = function () {};
}


},{}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {
  territoryResultFor: function territoryResultFor(game) {
    var blackDeadAsCaptures = game.deadPoints.filter(function (deadPoint) {
      return game.intersectionAt(deadPoint.y, deadPoint.x).isBlack();
    });
    var whiteDeadAsCaptures = game.deadPoints.filter(function (deadPoint) {
      return game.intersectionAt(deadPoint.y, deadPoint.x).isWhite();
    });

    return {
      black: game.territory().black.length + game.currentMove().whiteStonesCaptured + whiteDeadAsCaptures.length,
      white: game.territory().white.length + game.currentMove().blackStonesCaptured + blackDeadAsCaptures.length
    };
  },

  areaResultFor: function areaResultFor(game) {
    var blackStonesOnTheBoard = game.intersections().filter(function (intersection) {
      return intersection.isBlack() && !game.isDeadAt(intersection.y, intersection.x);
    });
    var whiteStonesOnTheBoard = game.intersections().filter(function (intersection) {
      return intersection.isWhite() && !game.isDeadAt(intersection.y, intersection.x);
    });

    return {
      black: game.territory().black.length + blackStonesOnTheBoard.length,
      white: game.territory().white.length + whiteStonesOnTheBoard.length
    };
  }
};


},{}],8:[function(require,module,exports){
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

    if (typeof options != "undefined") {
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