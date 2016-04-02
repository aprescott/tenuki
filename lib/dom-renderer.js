var utils = require("./utils");

var DOMRenderer = function(game, boardElement) {
  this.INTERSECTION_GAP_SIZE = 28;
  this.GUTTER_MARGIN = this.INTERSECTION_GAP_SIZE - 3;
  this.BASE_MARGIN = this.INTERSECTION_GAP_SIZE - 10;
  this.MARGIN = boardElement.hasAttribute("data-include-gutter") ? this.BASE_MARGIN + this.GUTTER_MARGIN : this.BASE_MARGIN;
  this.game = game;
  this.boardElement = boardElement;
  this.grid = [];

  this.setup = function() {
    var renderer = this;
    var game = renderer.game;

    utils.appendElement(boardElement, utils.createElement("div", { class: "lines horizontal" }));
    utils.appendElement(boardElement, utils.createElement("div", { class: "lines vertical" }));
    utils.appendElement(boardElement, utils.createElement("div", { class: "hoshi-points" }));
    utils.appendElement(boardElement, utils.createElement("div", { class: "intersections" }));

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

    boardElement.style.width = boardWidth + "px";
    boardElement.style.height = boardHeight + "px";

    utils.flatten(renderer.grid).forEach(function(intersectionEl) {
      utils.addEventListener(intersectionEl, "click", function() {
        var intersectionElement = this;
        var playedYPosition = Number(intersectionElement.getAttribute("data-position-y"));
        var playedXPosition = Number(intersectionElement.getAttribute("data-position-x"));

        if (game.isOver()) {
          game.toggleDeadAt(playedYPosition, playedXPosition);
        } else {
          game.playAt(playedYPosition, playedXPosition);
        }
      });
    });
  }

  this.render = function() {
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
