var utils = require("./utils");

var BoardRenderer = function(board, boardElement) {
  this.STONE_WIDTH = 28;
  this.GUTTER_MARGIN = 25;
  this.MARGIN = boardElement.hasAttribute("data-include-gutter") ? 18 + this.GUTTER_MARGIN : 18;
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
        hoshi.style.top = "calc(" + (renderer.MARGIN) + "px + " + (board.size - 1)/2 + "* " + (renderer.STONE_WIDTH + 1) + "px - 2px)";
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
            hoshi.style.top = "calc(" + (renderer.MARGIN) + "px + " + hoshiOffset + "* " + (renderer.STONE_WIDTH + 1) + "px - 2px)";
          }

          if (hoshiY == 1) {
            hoshi.style.top = "calc(" + (renderer.MARGIN) + "px + " + ((board.size + 1)/2 - 1) + "* " + (renderer.STONE_WIDTH + 1) + "px - 2px)";
          }

          if (hoshiY == 2) {
            hoshi.style.top = "calc(" + (renderer.MARGIN) + "px + " + (board.size - hoshiOffset - 1) + "* " + (renderer.STONE_WIDTH + 1) + "px - 2px)";
          }

          if (hoshiX == 0) {
            hoshi.style.left = "calc(" + (renderer.MARGIN) + "px + " + hoshiOffset + "* " + (renderer.STONE_WIDTH + 1) + "px - 2px)";
          }

          if (hoshiX == 1) {
            hoshi.style.left = "calc(" + (renderer.MARGIN) + "px + " + ((board.size + 1)/2 - 1) + "* " + (renderer.STONE_WIDTH + 1) + "px - 2px)";
          }

          if (hoshiX == 2) {
            hoshi.style.left = "calc(" + (renderer.MARGIN) + "px + " + (board.size - hoshiOffset - 1) + "* " + (renderer.STONE_WIDTH + 1) + "px - 2px)";
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

        intersectionElement.style.left = (x * (renderer.STONE_WIDTH + 1)) + "px";
        intersectionElement.style.top = (y * (renderer.STONE_WIDTH + 1)) + "px";

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

    boardElement.querySelector(".lines.horizontal").style.width = ((renderer.STONE_WIDTH * (board.size - 1)) + (board.size)*1) + "px";
    boardElement.querySelector(".lines.horizontal").style.height = ((renderer.STONE_WIDTH * (board.size - 1)) + (board.size)*1) + "px";
    boardElement.querySelector(".lines.vertical").style.width = ((renderer.STONE_WIDTH * (board.size - 1)) + (board.size)*1) + "px";
    boardElement.querySelector(".lines.vertical").style.height = ((renderer.STONE_WIDTH * (board.size - 1)) + (board.size)*1) + "px";

    var boardWidth = ((renderer.STONE_WIDTH * (board.size - 1)) + (board.size)*1 + (renderer.MARGIN)*2);
    var boardHeight = ((renderer.STONE_WIDTH * (board.size - 1)) + (board.size)*1 + (renderer.MARGIN)*2);

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
