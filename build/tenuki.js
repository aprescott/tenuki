/*!
 * tenuki v0.1.0 (https://github.com/aprescott/tenuki.js)
 * Copyright © 2016 Adam Prescott.
 * Licensed under the MIT license.
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.tenuki = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
exports.Game = require("./lib/game");
exports.utils = require("./lib/utils");

},{"./lib/game":3,"./lib/utils":7}],2:[function(require,module,exports){
var utils = require("./utils");

var DOMRenderer = function(game, boardElement) {
  this.INTERSECTION_GAP_SIZE = 28;
  this.GUTTER_MARGIN = this.INTERSECTION_GAP_SIZE - 3;
  this.BASE_MARGIN = this.INTERSECTION_GAP_SIZE - 10;
  this.MARGIN = boardElement.hasAttribute("data-include-gutter") ? this.BASE_MARGIN + this.GUTTER_MARGIN : this.BASE_MARGIN;
  this.game = game;
  this.boardElement = boardElement;
  this.grid = [];
  this.touchEventFired = false;

  this.setup = function() {
    var renderer = this;
    var game = renderer.game;
    var boardElement = this.boardElement;

    var innerContainer = utils.createElement("div", { class: "tenuki-inner-container" });
    renderer.innerContainer = innerContainer;
    utils.appendElement(boardElement, innerContainer);

    var zoomContainer = utils.createElement("div", { class: "tenuki-zoom-container" });
    renderer.zoomContainer = zoomContainer;
    utils.appendElement(innerContainer, zoomContainer);

    utils.appendElement(zoomContainer, utils.createElement("div", { class: "lines horizontal" }));
    utils.appendElement(zoomContainer, utils.createElement("div", { class: "lines vertical" }));
    utils.appendElement(zoomContainer, utils.createElement("div", { class: "hoshi-points" }));
    utils.appendElement(zoomContainer, utils.createElement("div", { class: "intersections" }));

    renderer.cancelZoomElement = utils.createElement("div", { class: "cancel-zoom" });
    cancelZoomBackdrop = utils.createElement("div", { class: "cancel-zoom-backdrop" });
    utils.addEventListener(renderer.cancelZoomElement, "click", function(e) {
      renderer.zoomOut();
    });
    utils.addEventListener(cancelZoomBackdrop, "click", function(e) {
      renderer.zoomOut();
    });
    utils.appendElement(innerContainer, renderer.cancelZoomElement);
    utils.appendElement(innerContainer, cancelZoomBackdrop);

    if (game.boardSize < 7) {
      if (game.boardSize > 1 && game.boardSize % 2 == 1) {
        var hoshi = utils.createElement("div", { class: "hoshi" });
        hoshi.style.top = "calc(" + (renderer.MARGIN) + "px + " + (game.boardSize - 1)/2 + "* " + (renderer.INTERSECTION_GAP_SIZE + 1) + "px - 2px)";
        hoshi.style.left = hoshi.style.top;

        utils.appendElement(boardElement.querySelector(".hoshi-points"), hoshi);
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

          var hoshi = utils.createElement("div", { class: "hoshi" });

          if (hoshiY == 0) {
            hoshi.style.top = "calc(" + (renderer.MARGIN) + "px + " + hoshiOffset + "* " + (renderer.INTERSECTION_GAP_SIZE + 1) + "px - 2px)";
          }

          if (hoshiY == 1) {
            hoshi.style.top = "calc(" + (renderer.MARGIN) + "px + " + ((game.boardSize + 1)/2 - 1) + "* " + (renderer.INTERSECTION_GAP_SIZE + 1) + "px - 2px)";
          }

          if (hoshiY == 2) {
            hoshi.style.top = "calc(" + (renderer.MARGIN) + "px + " + (game.boardSize - hoshiOffset - 1) + "* " + (renderer.INTERSECTION_GAP_SIZE + 1) + "px - 2px)";
          }

          if (hoshiX == 0) {
            hoshi.style.left = "calc(" + (renderer.MARGIN) + "px + " + hoshiOffset + "* " + (renderer.INTERSECTION_GAP_SIZE + 1) + "px - 2px)";
          }

          if (hoshiX == 1) {
            hoshi.style.left = "calc(" + (renderer.MARGIN) + "px + " + ((game.boardSize + 1)/2 - 1) + "* " + (renderer.INTERSECTION_GAP_SIZE + 1) + "px - 2px)";
          }

          if (hoshiX == 2) {
            hoshi.style.left = "calc(" + (renderer.MARGIN) + "px + " + (game.boardSize - hoshiOffset - 1) + "* " + (renderer.INTERSECTION_GAP_SIZE + 1) + "px - 2px)";
          }

          utils.appendElement(boardElement.querySelector(".hoshi-points"), hoshi);
        }
      }
    }

    for (var y = 0; y < game.boardSize; y++) {
      var horizontalLine = utils.createElement("div", { class: "line horizontal" });
      horizontalLine.setAttribute("data-left-gutter", game.yCoordinateFor(y));
      utils.appendElement(boardElement.querySelector(".lines.horizontal"), horizontalLine);

      var verticalLine = utils.createElement("div", { class: "line vertical" });
      verticalLine.setAttribute("data-top-gutter", game.xCoordinateFor(y))
      utils.appendElement(boardElement.querySelector(".lines.vertical"), verticalLine);

      for (var x = 0; x < game.boardSize; x++) {
        var intersectionElement = utils.createElement("div", { class: "intersection empty" });
        var highlightElement = utils.createElement("div", { class: "highlight" });
        utils.appendElement(intersectionElement, highlightElement);

        intersectionElement.setAttribute("data-position-x", x);
        intersectionElement.setAttribute("data-position-y", y);
        intersectionElement.game = game;

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

    boardElement.querySelector(".lines.horizontal").style.width = ((renderer.INTERSECTION_GAP_SIZE * (game.boardSize - 1)) + (game.boardSize)*1) + "px";
    boardElement.querySelector(".lines.horizontal").style.height = ((renderer.INTERSECTION_GAP_SIZE * (game.boardSize - 1)) + (game.boardSize)*1) + "px";
    boardElement.querySelector(".lines.vertical").style.width = ((renderer.INTERSECTION_GAP_SIZE * (game.boardSize - 1)) + (game.boardSize)*1) + "px";
    boardElement.querySelector(".lines.vertical").style.height = ((renderer.INTERSECTION_GAP_SIZE * (game.boardSize - 1)) + (game.boardSize)*1) + "px";

    var boardWidth = ((renderer.INTERSECTION_GAP_SIZE * (game.boardSize - 1)) + (game.boardSize)*1 + (renderer.MARGIN)*2);
    var boardHeight = ((renderer.INTERSECTION_GAP_SIZE * (game.boardSize - 1)) + (game.boardSize)*1 + (renderer.MARGIN)*2);

    innerContainer.style.width = boardWidth + "px";
    innerContainer.style.height = boardHeight + "px";

    zoomContainer.style.width = boardWidth + "px";
    zoomContainer.style.height = boardHeight + "px";

    utils.flatten(renderer.grid).forEach(function(intersectionEl) {
      utils.addEventListener(intersectionEl, "touchstart", function() {
        renderer.touchEventFired = true;
      });

      utils.addEventListener(intersectionEl, "mouseenter", function() {
        var intersectionElement = this;

        utils.addClass(intersectionElement, "hovered");
      });

      utils.addEventListener(intersectionEl, "mouseleave", function() {
        var intersectionElement = this;

        utils.removeClass(intersectionElement, "hovered");
        game.renderer.resetTouchedPoint();
      });

      utils.addEventListener(intersectionEl, "click", function() {
        var intersectionElement = this;
        var playedYPosition = Number(intersectionElement.getAttribute("data-position-y"));
        var playedXPosition = Number(intersectionElement.getAttribute("data-position-x"));

        var playOrToggleDead = function() {
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
        if (!renderer.touchEventFired || (document.body.clientWidth / window.innerWidth > 1) || game.isOver()) {
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
      utils.addClass(boardElement, "tenuki-scaled");
      innerContainer.style["transform-origin"] = "top left";
      innerContainer.style.transform = "scale3d(" + scale + ", " + scale + ", 1)";

      // reset the outer element's height to match, ensuring that we free up any lingering whitespace
      boardElement.style.width = innerContainer.getBoundingClientRect().width + "px";
      boardElement.style.height = innerContainer.getBoundingClientRect().height + "px";
    }

    utils.addEventListener(boardElement, "touchstart", function(event) {
      if (event.touches.length > 1) {
        return;
      }

      if (!utils.hasClass(boardElement, "tenuki-zoomed")) {
        return;
      }

      var xCursor = event.changedTouches[0].clientX;
      var yCursor = event.changedTouches[0].clientY;

      renderer.dragStartX = xCursor - this.offsetLeft;
      renderer.dragStartY = yCursor - this.offsetTop;
      zoomContainer.style.transition = "none";
    });

    utils.addEventListener(innerContainer, "touchend", function(event) {
      if (event.touches.length > 1) {
        return;
      }

      if (!utils.hasClass(boardElement, "tenuki-zoomed")) {
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

    utils.addEventListener(innerContainer, "touchmove", function(event) {
      if (event.touches.length > 1) {
        return;
      }

      if (!utils.hasClass(boardElement, "tenuki-zoomed")) {
        return true;
      }

      // prevent pull-to-refresh
      event.preventDefault();

      renderer.moveInProgress = true;

      var xCursor = event.changedTouches[0].clientX;
      var yCursor = event.changedTouches[0].clientY;

      var deltaX = xCursor - renderer.dragStartX;
      var deltaY = yCursor - renderer.dragStartY;

      var translateY = renderer.translateY + deltaY/2.5;
      var translateX = renderer.translateX + deltaX/2.5;

      if (translateY > 0.5*innerContainer.clientHeight - renderer.MARGIN) {
        translateY = 0.5*innerContainer.clientHeight - renderer.MARGIN;
      }

      if (translateX > 0.5*innerContainer.clientWidth - renderer.MARGIN) {
        translateX = 0.5*innerContainer.clientWidth - renderer.MARGIN;
      }

      if (translateY < -0.5*innerContainer.clientHeight + renderer.MARGIN) {
        translateY = -0.5*innerContainer.clientHeight + renderer.MARGIN;
      }

      if (translateX < -0.5*innerContainer.clientWidth + renderer.MARGIN) {
        translateX = -0.5*innerContainer.clientWidth + renderer.MARGIN;
      }

      zoomContainer.style.transform = "translate3d(" + 2.5*translateX + "px, " + 2.5*translateY + "px, 0) scale3d(2.5, 2.5, 1)";

      renderer.lastTranslateX = translateX;
      renderer.lastTranslateY = translateY;
    });
  }

  this.showPossibleMoveAt = function(intersectionElement) {
    var renderer = this;
    var boardElement = this.boardElement;
    var innerContainer = this.innerContainer;
    var zoomContainer = this.zoomContainer;

    renderer.touchedPoint = intersectionElement;

    if (utils.hasClass(boardElement, "tenuki-scaled")) {
      var top = intersectionElement.offsetTop;
      var left = intersectionElement.offsetLeft;

      var translateY = 0.5 * zoomContainer.clientHeight - top - renderer.MARGIN;
      var translateX = 0.5 * zoomContainer.clientWidth - left - renderer.MARGIN;

      zoomContainer.style.transform = "translate3d(" + 2.5*translateX + "px, " + 2.5*translateY + "px, 0) scale3d(2.5, 2.5, 1)";
      renderer.translateY = translateY;
      renderer.translateX = translateX;

      utils.addClass(renderer.cancelZoomElement, "visible");
      utils.addClass(renderer.boardElement, "tenuki-zoomed");
    }
  };

  this.resetTouchedPoint = function() {
    var renderer = this;

    renderer.touchedPoint = null;
  }

  this.zoomOut = function() {
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

    utils.removeClass(renderer.cancelZoomElement, "visible");
    utils.removeClass(renderer.boardElement, "tenuki-zoomed");
  };

  this.render = function() {
    this.resetTouchedPoint();

    this.renderStonesPlayed();
    this.updateMarkerPoints();
    this.updateCurrentPlayer();

    if (this.game.isOver()) {
      this.renderTerritory();
    }
  }

  this.renderStonesPlayed = function() {
    var renderer = this;
    var game = renderer.game;
    var currentMove = game.currentMove();
    var points = currentMove ? currentMove.points : game.intersections();

    points.forEach(function(intersection) {
      renderer.renderIntersection(intersection);
    });
  };

  this.updateMarkerPoints = function() {
    var renderer = this;
    var game = this.game;
    var currentMove = game.currentMove();

    if (!currentMove) {
      return;
    }

    game.intersections().forEach(function(intersection) {
      if (game.wouldBeSuicide(intersection.y, intersection.x)) {
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
    var game = this.game;
    var previousPlayer = (game.currentPlayer == "black" ? "white" : "black");
    utils.removeClass(boardElement, previousPlayer + "-to-play");
    utils.addClass(boardElement, game.currentPlayer + "-to-play");

    if (game.isOver()) {
      utils.removeClass(boardElement, "black-to-play");
      utils.removeClass(boardElement, "white-to-play");
    }
  };

  this.renderIntersection = function(intersection) {
    var renderer = this;
    var game = this.game;

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
    var game = this.game;

    game.intersections().forEach(function(intersection) {
      utils.removeClass(renderer.grid[intersection.y][intersection.x], "territory-black");
      utils.removeClass(renderer.grid[intersection.y][intersection.x], "territory-white");

      if (game.isDeadAt(intersection.y, intersection.x)) {
        utils.addClass(renderer.grid[intersection.y][intersection.x], "dead");
      } else {
        utils.removeClass(renderer.grid[intersection.y][intersection.x], "dead");
      }
    });

    game.territoryPoints.black.forEach(function(territoryPoint) {
      utils.addClass(renderer.grid[territoryPoint.y][territoryPoint.x], "territory-black");
    });

    game.territoryPoints.white.forEach(function(territoryPoint) {
      utils.addClass(renderer.grid[territoryPoint.y][territoryPoint.x], "territory-white");
    });
  };
};

module.exports = DOMRenderer;

},{"./utils":7}],3:[function(require,module,exports){
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
        var intersection = new Intersection(y, x, game);
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

},{"./dom-renderer":2,"./intersection":4,"./null-renderer":5,"./scorer":6,"./utils":7}],4:[function(require,module,exports){
var Intersection = function(y, x, game) {
  this.y = y;
  this.x = x;
  this.value = "empty";
  this.game = game;

  this.duplicate = function() {
    var duplicateIntersection = new Intersection(this.y, this.x, this.game);
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
  territoryResultFor: function(game) {
    var blackDeadAsCaptures = game.deadPoints.filter(function(deadPoint) { return game.intersectionAt(deadPoint.y, deadPoint.x).isBlack(); });
    var whiteDeadAsCaptures = game.deadPoints.filter(function(deadPoint) { return game.intersectionAt(deadPoint.y, deadPoint.x).isWhite(); });

    return {
      black: game.territoryPoints.black.length + game.captures.white + whiteDeadAsCaptures.length,
      white: game.territoryPoints.white.length + game.captures.black + blackDeadAsCaptures.length
    };
  },

  areaResultFor: function(game) {
    var blackStonesOnTheBoard = game.intersections().filter(function(intersection) { return intersection.isBlack() && !game.isDeadAt(intersection.y, intersection.x); });
    var whiteStonesOnTheBoard = game.intersections().filter(function(intersection) { return intersection.isWhite() && !game.isDeadAt(intersection.y, intersection.x); });

    return {
      black: game.territoryPoints.black.length + blackStonesOnTheBoard.length,
      white: game.territoryPoints.white.length + whiteStonesOnTheBoard.length
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