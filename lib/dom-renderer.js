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
