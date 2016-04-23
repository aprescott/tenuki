/*!
 * tenuki v0.1.0 (https://github.com/aprescott/tenuki.js)
 * Copyright © 2016 Adam Prescott.
 * Licensed under the MIT license.
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.tenuki = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

exports.Game = require("./lib/game").default;
exports.utils = require("./lib/utils").default;

},{"./lib/game":3,"./lib/utils":7}],2:[function(require,module,exports){
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
    var points = currentMove ? currentMove.points : game.intersections();

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

    if (!currentMove.pass) {
      _utils2.default.addClass(renderer.grid[currentMove.y][currentMove.x], "marker");
    }
  };

  this.updateCurrentPlayer = function () {
    var game = this.game;
    var previousPlayer = game.currentPlayer == "black" ? "white" : "black";
    _utils2.default.removeClass(boardElement, previousPlayer + "-to-play");
    _utils2.default.addClass(boardElement, game.currentPlayer + "-to-play");

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

    game.territoryPoints.black.forEach(function (territoryPoint) {
      _utils2.default.addClass(renderer.grid[territoryPoint.y][territoryPoint.x], "territory-black");
    });

    game.territoryPoints.white.forEach(function (territoryPoint) {
      _utils2.default.addClass(renderer.grid[territoryPoint.y][territoryPoint.x], "territory-white");
    });
  };
};


},{"./utils":7}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Game;

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

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function Game(boardElement) {
  this._defaultBoardSize = 19;
  this.boardSize = null;
  this.intersectionGrid = [];
  this.currentPlayer = "black";
  this.moves = [];
  this.captures = {
    black: 0,
    white: 0
  };
  this.renderer = boardElement ? new _domRenderer2.default(this, boardElement) : new _nullRenderer2.default();
  this.callbacks = {
    postRender: function postRender() {}
  };
  this.deadPoints = [];
  this.territoryPoints = { black: [], white: [] };

  this._configureOptions = function () {
    var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var _ref$boardSize = _ref.boardSize;
    var boardSize = _ref$boardSize === undefined ? this._defaultBoardSize : _ref$boardSize;

    this.boardSize = boardSize;
  };

  this.setup = function (options) {
    this._configureOptions(options);

    if (this.boardSize > 19) {
      throw "cannot generate a board size greater than 19";
    }

    this.renderer.setup();

    for (var y = 0; y < this.boardSize; y++) {
      for (var x = 0; x < this.boardSize; x++) {
        var intersection = new _intersection2.default(y, x);
        this.intersectionGrid[y] || (this.intersectionGrid[y] = []);
        this.intersectionGrid[y][x] = intersection;
      }
    }

    this.render();
  };

  this.intersectionAt = function (y, x) {
    return this.intersectionGrid[y][x];
  };

  this.intersections = function () {
    return _utils2.default.flatten(this.intersectionGrid);
  };

  this.yCoordinateFor = function (y) {
    return this.boardSize - y;
  };

  this.xCoordinateFor = function (x) {
    var letters = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"];

    return letters[x];
  };

  this.coordinatesFor = function (y, x) {
    return this.xCoordinateFor(x) + this.yCoordinateFor(y);
  };

  this.stateFor = function (y, x, captures) {
    var _this = this;

    var moveInfo = {
      y: y,
      x: x,
      coordinates: this.coordinatesFor(y, x),
      color: this.currentPlayer,
      pass: false,
      points: this.intersections().map(function (i) {
        return i.duplicate();
      }),
      blackStonesCaptured: this.captures.black,
      whiteStonesCaptured: this.captures.white,
      capturedPositions: captures.map(function (capturedStone) {
        return { y: capturedStone.y, x: capturedStone.x, color: _this.isBlackPlaying() ? "white" : "black" };
      })
    };

    if (this.isKoFrom(y, x, captures)) {
      moveInfo["koPoint"] = { y: captures[0].y, x: captures[0].x };
    } else {
      moveInfo["koPoint"] = null;
    }

    return moveInfo;
  };

  this.whiteAt = function (y, x) {
    this.intersectionAt(y, x).setWhite();
  };
  this.blackAt = function (y, x) {
    this.intersectionAt(y, x).setBlack();
  };
  this.removeAt = function (y, x) {
    this.intersectionAt(y, x).setEmpty();
  };

  this.stateForPass = function () {
    return {
      y: null,
      x: null,
      coordinates: null,
      color: this.currentPlayer,
      pass: true,
      points: this.intersections().map(function (i) {
        return i.duplicate();
      }),
      blackStonesCaptured: this.captures.black,
      whiteStonesCaptured: this.captures.white,
      capturedPositions: []
    };
  };

  this.playAt = function (y, x) {
    if (this.isIllegalAt(y, x)) {
      return false;
    }

    this[this.currentPlayer + "At"](y, x);

    var captures = this.clearCapturesFor(y, x);

    this.moves.push(this.stateFor(y, x, captures));
    this.render();

    return true;
  };

  this.currentMove = function () {
    return this.moves[this.moves.length - 1];
  };

  this.isWhitePlaying = function () {
    return this.currentPlayer == "white";
  };

  this.isBlackPlaying = function () {
    return this.currentPlayer == "black";
  };

  this.inAtari = function (y, x) {
    return this.libertiesAt(y, x) == 1;
  };

  this.wouldBeSuicide = function (y, x) {
    var _this2 = this;

    var intersection = this.intersectionAt(y, x);
    var surroundedEmptyPoint = intersection.isEmpty() && this.neighborsFor(intersection.y, intersection.x).filter(function (neighbor) {
      return neighbor.isEmpty();
    }).length == 0;

    if (!surroundedEmptyPoint) {
      return false;
    }

    var suicide = true;

    var friendlyNeighbors = this.neighborsFor(intersection.y, intersection.x).filter(function (neighbor) {
      return neighbor.isOccupiedWith(_this2.currentPlayer);
    });

    var someFriendlyNotInAtari = this.neighborsFor(intersection.y, intersection.x).some(function (neighbor) {
      var inAtari = _this2.inAtari(neighbor.y, neighbor.x);
      var friendly = neighbor.isOccupiedWith(_this2.currentPlayer);

      return friendly && !inAtari;
    });

    if (someFriendlyNotInAtari) {
      suicide = false;
    }

    var someEnemyInAtari = this.neighborsFor(intersection.y, intersection.x).some(function (neighbor) {
      var inAtari = _this2.inAtari(neighbor.y, neighbor.x);
      var enemy = !neighbor.isOccupiedWith(_this2.currentPlayer);

      return enemy && inAtari;
    });

    if (someEnemyInAtari) {
      suicide = false;
    }

    return suicide;
  };

  this.pass = function () {
    if (!this.isOver()) {
      this.moves.push(this.stateForPass());
      this.render();
    }
  };

  this.isOver = function () {
    if (this.moves.length < 2) {
      return false;
    }

    var currentMove = this.currentMove();
    var previousMove = this.moves[this.moves.length - 2];

    return currentMove.pass && previousMove.pass;
  };

  this.toggleDeadAt = function (y, x) {
    var _this3 = this;

    var alreadyDead = this.isDeadAt(y, x);

    this.groupAt(y, x).forEach(function (intersection) {
      if (alreadyDead) {
        _this3.deadPoints = _this3.deadPoints.filter(function (dead) {
          return !(dead.y == intersection.y && dead.x == intersection.x);
        });
      } else {
        _this3.deadPoints.push({ y: intersection.y, x: intersection.x });
      }
    });

    this.render();
  };

  this.isDeadAt = function (y, x) {
    return this.deadPoints.some(function (dead) {
      return dead.y == y && dead.x == x;
    });
  };

  this.territoryScore = function () {
    return _scorer2.default.territoryResultFor(this);
  };

  this.areaScore = function () {
    return _scorer2.default.areaResultFor(this);
  };

  this.isKoFrom = function (y, x, captures) {
    var point = this.intersectionAt(y, x);

    return captures.length == 1 && this.groupAt(point.y, point.x).length == 1 && this.inAtari(point.y, point.x);
  };

  this.libertiesAt = function (y, x) {
    var _this4 = this;

    var point = this.intersectionAt(y, x);

    var emptyPoints = _utils2.default.flatMap(this.groupAt(point.y, point.x), function (groupPoint) {
      return _this4.neighborsFor(groupPoint.y, groupPoint.x).filter(function (intersection) {
        return intersection.isEmpty();
      });
    });

    // this is not great, but we need a representation that will be unique-able,
    // and Y-X does the job.
    return _utils2.default.unique(emptyPoints.map(function (emptyPoint) {
      return emptyPoint.y + "-" + emptyPoint.x;
    })).length;
  };

  this.groupAt = function (y, x) {
    var startingPoint = this.intersectionAt(y, x);

    var partition = this.partitionTraverse(startingPoint, function (neighbor) {
      return neighbor.sameColorAs(startingPoint);
    });

    return partition[0];
  };

  this.neighborsFor = function (y, x) {
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
  };

  this.hasCapturesFor = function (y, x) {
    var _this5 = this;

    var point = this.intersectionAt(y, x);

    var capturedNeighbors = this.neighborsFor(point.y, point.x).filter(function (neighbor) {
      return !neighbor.isEmpty && !neighbor.sameColorAs(point) && _this5.libertiesAt(neighbor.y, neighbor.x) == 0;
    });

    return capturedNeighbors.length > 0;
  };

  this.clearCapturesFor = function (y, x) {
    var _this6 = this;

    var point = this.intersectionAt(y, x);

    var capturedNeighbors = this.neighborsFor(point.y, point.x).filter(function (neighbor) {
      return !neighbor.isEmpty() && !neighbor.sameColorAs(point) && _this6.libertiesAt(neighbor.y, neighbor.x) == 0;
    });

    var capturedStones = _utils2.default.flatMap(capturedNeighbors, function (neighbor) {
      return _this6.groupAt(neighbor.y, neighbor.x);
    });

    capturedStones.forEach(function (capturedStone) {
      if (capturedStone.isBlack()) {
        _this6.captures["black"] += 1;
      } else {
        _this6.captures["white"] += 1;
      }

      _this6.removeAt(capturedStone.y, capturedStone.x);
    });

    return capturedStones;
  };

  this.isIllegalAt = function (y, x) {
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
  };

  this.render = function () {
    var _this7 = this;

    var currentMove = this.currentMove();

    if (!this.isOver()) {
      this.removeScoringState();
    }

    var points = currentMove ? currentMove.points : this.intersections();

    points.forEach(function (intersection) {
      if (!currentMove) {
        intersection.setEmpty();
      }

      _this7.intersectionGrid[intersection.y][intersection.x] = intersection.duplicate();
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
      };
    }

    this.checkTerritory();
    this.renderer.render();
    this.callbacks.postRender(this);
  };

  this.removeScoringState = function () {
    this.deadPoints = [];
    this.territoryPoints = { black: [], white: [] };
  };

  // Iterative depth-first search traversal. Start from
  // startingPoint, iteratively follow all neighbors.
  // If inclusionConditionis met for a neighbor, include it
  // otherwise, exclude it. At the end, return two arrays:
  // One for the included neighbors, another for the remaining neighbors.
  this.partitionTraverse = function (startingPoint, inclusionCondition) {
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
  };

  this.checkTerritory = function () {
    var _this8 = this;

    this.territoryPoints = { black: [], white: [] };

    var emptyOrDeadPoints = this.intersections().filter(function (intersection) {
      return intersection.isEmpty() || _this8.isDeadAt(intersection.y, intersection.x);
    });

    if (!this.isOver() || emptyOrDeadPoints.length == 0) {
      return;
    }

    var checkedPoints = [];
    var pointsToCheck = emptyOrDeadPoints.map(function (i) {
      return i.duplicate();
    });

    while (pointsToCheck.length > 0) {
      var nextPoint = pointsToCheck.pop();
      checkedPoints = checkedPoints.concat(this.checkTerritoryStartingAt(nextPoint.y, nextPoint.x));
      pointsToCheck = emptyOrDeadPoints.filter(function (i) {
        return checkedPoints.indexOf(i) < 0;
      });
    }
  };

  this.checkTerritoryStartingAt = function (y, x) {
    var _this9 = this;

    var startingPoint = this.intersectionAt(y, x);

    var partition = this.partitionTraverse(startingPoint, function (neighbor) {
      return neighbor.isEmpty() || _this9.isDeadAt(neighbor.y, neighbor.x);
    });

    var nonOccupiedPoints = partition[0];
    var occupiedPoints = partition[1];

    var surroundingColors = _utils2.default.unique(occupiedPoints.map(function (occupiedPoint) {
      return occupiedPoint.value;
    }));

    if (surroundingColors.length == 1 && surroundingColors[0] != "empty") {
      (function () {
        var territoryColor = surroundingColors[0];

        nonOccupiedPoints.forEach(function (nonOccupiedPoint) {
          return _this9.markTerritory(nonOccupiedPoint.y, nonOccupiedPoint.x, territoryColor);
        });
      })();
    }

    return nonOccupiedPoints;
  };

  this.markTerritory = function (y, x, color) {
    var pointIsMarkedTerritory = this.territoryPoints[color].some(function (point) {
      return point.y == y && point.x == x;
    });

    if (!pointIsMarkedTerritory) {
      this.territoryPoints[color].push({ y: y, x: x });
    }
  };

  this.undo = function () {
    this.moves.pop();
    this.render();
  };
};


},{"./dom-renderer":2,"./intersection":4,"./null-renderer":5,"./scorer":6,"./utils":7}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Intersection;
function Intersection(y, x) {
  this.y = y;
  this.x = x;
  this.value = "empty";

  this.duplicate = function () {
    var duplicateIntersection = new Intersection(this.y, this.x);
    duplicateIntersection.value = this.value;

    return duplicateIntersection;
  };

  this.setWhite = function () {
    this.value = "white";
  };

  this.isOccupiedWith = function (color) {
    if (this.isEmpty()) {
      return false;
    }

    return this.value === color;
  };

  this.setBlack = function () {
    this.value = "black";
  };

  this.isBlack = function () {
    return this.value === "black";
  };

  this.isWhite = function () {
    return this.value === "white";
  };

  this.setEmpty = function () {
    this.value = "empty";
  };

  this.isEmpty = function () {
    return this.value === "empty";
  };

  this.sameColorAs = function (otherIntersection) {
    return this.value === otherIntersection.value;
  };
};


},{}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = NullRenderer;
function NullRenderer() {
  this.setup = function () {};
  this.render = function () {};
}


},{}],6:[function(require,module,exports){
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
      black: game.territoryPoints.black.length + game.captures.white + whiteDeadAsCaptures.length,
      white: game.territoryPoints.white.length + game.captures.black + blackDeadAsCaptures.length
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
      black: game.territoryPoints.black.length + blackStonesOnTheBoard.length,
      white: game.territoryPoints.white.length + whiteStonesOnTheBoard.length
    };
  }
};


},{}],7:[function(require,module,exports){
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