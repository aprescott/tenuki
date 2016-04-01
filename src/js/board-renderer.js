tenuki.BoardRenderer = function(board, boardElement) {
  this.board = board;
  this.boardElement = boardElement;
  this.grid = [];

  this.setup = function() {
    var renderer = this;
    var board = renderer.board;

    tenuki.utils.appendElement(boardElement, tenuki.utils.createElement("div", { class: "lines horizontal" }));
    tenuki.utils.appendElement(boardElement, tenuki.utils.createElement("div", { class: "lines vertical" }));
    tenuki.utils.appendElement(boardElement, tenuki.utils.createElement("div", { class: "hoshi-points" }));
    tenuki.utils.appendElement(boardElement, tenuki.utils.createElement("div", { class: "intersections" }));

    var hoshiOffset = board.size > 9 ? 3 : 2;

    for (var hoshiY = 0; hoshiY < 3; hoshiY++) {
      for (var hoshiX = 0; hoshiX < 3; hoshiX++) {
        var hoshi = tenuki.utils.createElement("div", { class: "hoshi" });

        var hoshiStyleAttributeName;
        var hoshiStyleAttributeValue;

        if (hoshiY == 0) {
          hoshi.style.top = "calc(" + (tenuki.MARGIN) + "px + " + hoshiOffset + "* " + (tenuki.STONE_WIDTH + 1) + "px - 2px)";
        }

        if (hoshiY == 1) {
          hoshi.style.top = "calc(" + (tenuki.MARGIN) + "px + " + ((board.size + 1)/2 - 1) + "* " + (tenuki.STONE_WIDTH + 1) + "px - 2px)";
        }

        if (hoshiY == 2) {
          hoshi.style.top = "calc(" + (tenuki.MARGIN) + "px + " + (board.size - hoshiOffset - 1) + "* " + (tenuki.STONE_WIDTH + 1) + "px - 2px)";
        }

        if (hoshiX == 0) {
          hoshi.style.left = "calc(" + (tenuki.MARGIN) + "px + " + hoshiOffset + "* " + (tenuki.STONE_WIDTH + 1) + "px - 2px)";
        }

        if (hoshiX == 1) {
          hoshi.style.left = "calc(" + (tenuki.MARGIN) + "px + " + ((board.size + 1)/2 - 1) + "* " + (tenuki.STONE_WIDTH + 1) + "px - 2px)";
        }

        if (hoshiX == 2) {
          hoshi.style.left = "calc(" + (tenuki.MARGIN) + "px + " + (board.size - hoshiOffset - 1) + "* " + (tenuki.STONE_WIDTH + 1) + "px - 2px)";
        }

        tenuki.utils.appendElement(boardElement.querySelector(".hoshi-points"), hoshi);
      }
    }

    for (var y = 0; y < board.size; y++) {
      var horizontalLine = tenuki.utils.createElement("div", { class: "line horizontal" });
      tenuki.utils.appendElement(boardElement.querySelector(".lines.horizontal"), horizontalLine);

      var verticalLine = tenuki.utils.createElement("div", { class: "line vertical" });
      tenuki.utils.appendElement(boardElement.querySelector(".lines.vertical"), verticalLine);

      for (var x = 0; x < board.size; x++) {
        var intersectionElement = tenuki.utils.createElement("div", { class: "intersection empty" });
        var highlightElement = tenuki.utils.createElement("div", { class: "highlight" });
        tenuki.utils.appendElement(intersectionElement, highlightElement);

        intersectionElement.setAttribute("data-position-x", x);
        intersectionElement.setAttribute("data-position-y", y);
        intersectionElement.board = board;

        intersectionElement.style.left = (x * (tenuki.STONE_WIDTH + 1)) + "px";
        intersectionElement.style.top = (y * (tenuki.STONE_WIDTH + 1)) + "px";

        tenuki.utils.appendElement(boardElement.querySelector(".intersections"), intersectionElement);

        renderer.grid[y] || (renderer.grid[y] = []);
        renderer.grid[y][x] = intersectionElement;
      }
    }

    // prevent the text-selection cursor
    tenuki.utils.addEventListener(boardElement.querySelector(".lines.horizontal"), "mousedown", function(e) {
      e.preventDefault();
    });
    tenuki.utils.addEventListener(boardElement.querySelector(".lines.vertical"), "mousedown", function(e) {
      e.preventDefault();
    });

    boardElement.querySelector(".lines.horizontal").style.width = ((tenuki.STONE_WIDTH * (board.size - 1)) + (board.size)*1) + "px";
    boardElement.querySelector(".lines.horizontal").style.height = ((tenuki.STONE_WIDTH * (board.size - 1)) + (board.size)*1) + "px";
    boardElement.querySelector(".lines.vertical").style.width = ((tenuki.STONE_WIDTH * (board.size - 1)) + (board.size)*1) + "px";
    boardElement.querySelector(".lines.vertical").style.height = ((tenuki.STONE_WIDTH * (board.size - 1)) + (board.size)*1) + "px";

    var boardWidth = ((tenuki.STONE_WIDTH * (board.size - 1)) + (board.size)*1 + (tenuki.MARGIN)*2);
    var boardHeight = ((tenuki.STONE_WIDTH * (board.size - 1)) + (board.size)*1 + (tenuki.MARGIN)*2);

    boardElement.style.width = boardWidth + "px";
    boardElement.style.height = boardHeight + "px";

    renderer.grid.flatten().forEach(function(intersectionEl) {
      tenuki.utils.addEventListener(intersectionEl, "click", function() {
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
    var points = currentMove ? currentMove.points : board.intersections.flatten();

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

    board.intersections.flatten().forEach(function(intersection) {
      if (board.wouldBeSuicide(intersection.y, intersection.x)) {
        tenuki.utils.addClass(renderer.grid[intersection.y][intersection.x], "suicide");
      }
    });

    if (currentMove.koPoint) {
      tenuki.utils.addClass(renderer.grid[currentMove.koPoint.y][currentMove.koPoint.x], "ko");
    }

    if (!currentMove.pass) {
      tenuki.utils.addClass(renderer.grid[currentMove.y][currentMove.x], "marker");
    }
  };

  this.updateCurrentPlayer = function() {
    var board = this.board;
    var previousPlayer = (board.currentPlayer == "black" ? "white" : "black");
    tenuki.utils.removeClass(boardElement, previousPlayer + "-to-play");
    tenuki.utils.addClass(boardElement, board.currentPlayer + "-to-play");

    if (board.isGameOver()) {
      tenuki.utils.removeClass(boardElement, "black-to-play");
      tenuki.utils.removeClass(boardElement, "white-to-play");
    }
  };

  this.renderIntersection = function(intersection) {
    var renderer = this;
    var board = this.board;

    var intersectionEl = renderer.grid[intersection.y][intersection.x];
    intersectionEl.className = ""; // be clear that we're removing all classes
    tenuki.utils.addClass(intersectionEl, "intersection");

    if (intersection.isEmpty()) {
      tenuki.utils.addClass(intersectionEl, "empty");
    } else {
      tenuki.utils.addClass(intersectionEl, "stone");

      if (intersection.isBlack()) {
        tenuki.utils.addClass(intersectionEl, "black");
      } else {
        tenuki.utils.addClass(intersectionEl, "white");
      }
    }
  };

  this.renderTerritory = function() {
    var renderer = this;
    var board = this.board;

    board.intersections.flatten().forEach(function(intersection) {
      tenuki.utils.removeClass(renderer.grid[intersection.y][intersection.x], "territory-black");
      tenuki.utils.removeClass(renderer.grid[intersection.y][intersection.x], "territory-white");

      if (board.isDeadAt(intersection.y, intersection.x)) {
        tenuki.utils.addClass(renderer.grid[intersection.y][intersection.x], "dead");
      } else {
        tenuki.utils.removeClass(renderer.grid[intersection.y][intersection.x], "dead");
      }
    });

    board.territoryPoints.black.forEach(function(territoryPoint) {
      tenuki.utils.addClass(renderer.grid[territoryPoint.y][territoryPoint.x], "territory-black");
    });

    board.territoryPoints.white.forEach(function(territoryPoint) {
      tenuki.utils.addClass(renderer.grid[territoryPoint.y][territoryPoint.x], "territory-white");
    });
  };
}
