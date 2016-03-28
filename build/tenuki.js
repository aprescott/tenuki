/*!
 * tenuki.js v0.0.1 (https://github.com/aprescott/tenuki.js)
 * Copyright © 2016 Adam Prescott.
 * Licensed under the MIT license.
 */
tenuki = window.tenuki || {};

tenuki.MARGIN = 18;
tenuki.STONE_WIDTH = 28;
if (!Array.prototype.flatMap) {
  Array.prototype.flatMap = function(lambda) {
    return Array.prototype.concat.apply([], this.map(lambda));
  };
}

if (!Array.prototype.flatten) {
  Array.prototype.flatten = function() {
    return this.reduce(function(a, b) { return a.concat(b); })
  }
}

if (!Array.prototype.sample) {
  Array.prototype.sample = function() {
    return this[Math.floor(Math.random() * this.length)];
  }
}
tenuki.Board = function(element, size) {
  this.element = element;
  this.defaultSize = 19;
  this.size = size || this.defaultSize;
  this.intersections = [];
  this.grid = [];
  this.currentPlayer = "black";
  this.moves = [];
  this.captures = {
    black: 0,
    white: 0
  };
  this.callbacks = {
    postRender: function() {}
  };
  this.setup = function() {
    var board = this;

    tenuki.utils.appendElement(board.element, tenuki.utils.createElement("div", { class: "lines horizontal" }));
    tenuki.utils.appendElement(board.element, tenuki.utils.createElement("div", { class: "lines vertical" }));
    tenuki.utils.appendElement(board.element, tenuki.utils.createElement("div", { class: "hoshi-points" }));
    tenuki.utils.appendElement(board.element, tenuki.utils.createElement("div", { class: "intersections" }));

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

        tenuki.utils.appendElement(board.element.querySelector(".hoshi-points"), hoshi);
      }
    }

    for (var y = 0; y < board.size; y++) {
      var horizontalLine = tenuki.utils.createElement("div", { class: "line horizontal" });
      tenuki.utils.appendElement(board.element.querySelector(".lines.horizontal"), horizontalLine);

      var verticalLine = tenuki.utils.createElement("div", { class: "line vertical" });
      tenuki.utils.appendElement(board.element.querySelector(".lines.vertical"), verticalLine);

      for (var x = 0; x < board.size; x++) {
        var intersectionElement = tenuki.utils.createElement("div", { class: "intersection empty" });
        var highlightElement = tenuki.utils.createElement("div", { class: "highlight" });
        tenuki.utils.appendElement(intersectionElement, highlightElement);

        intersectionElement.setAttribute("data-position-x", x);
        intersectionElement.setAttribute("data-position-y", y);
        intersectionElement.board = board;

        intersectionElement.style.left = (x * (tenuki.STONE_WIDTH + 1)) + "px";
        intersectionElement.style.top = (y * (tenuki.STONE_WIDTH + 1)) + "px";

        tenuki.utils.appendElement(board.element.querySelector(".intersections"), intersectionElement);

        var intersection = new tenuki.Intersection(y, x, board);
        board.intersections[y] || (board.intersections[y] = []);
        board.intersections[y][x] = intersection;

        board.grid[y] || (board.grid[y] = []);
        board.grid[y][x] = intersectionElement;
      }
    }

    // prevent the text-selection cursor
    tenuki.utils.addEventListener(board.element.querySelector(".lines.horizontal"), "mousedown", function(e) {
      e.preventDefault();
    });
    tenuki.utils.addEventListener(board.element.querySelector(".lines.vertical"), "mousedown", function(e) {
      e.preventDefault();
    });

    board.element.querySelector(".lines.horizontal").style.width = ((tenuki.STONE_WIDTH * (board.size - 1)) + (board.size)*1) + "px";
    board.element.querySelector(".lines.horizontal").style.height = ((tenuki.STONE_WIDTH * (board.size - 1)) + (board.size)*1) + "px";
    board.element.querySelector(".lines.vertical").style.width = ((tenuki.STONE_WIDTH * (board.size - 1)) + (board.size)*1) + "px";
    board.element.querySelector(".lines.vertical").style.height = ((tenuki.STONE_WIDTH * (board.size - 1)) + (board.size)*1) + "px";

    var boardWidth = ((tenuki.STONE_WIDTH * (board.size - 1)) + (board.size)*1 + (tenuki.MARGIN)*2);
    var boardHeight = ((tenuki.STONE_WIDTH * (board.size - 1)) + (board.size)*1 + (tenuki.MARGIN)*2);

    board.element.style.width = boardWidth + "px";
    board.element.style.height = boardHeight + "px";

    board.grid.flatten().forEach(function(intersectionEl) {
      tenuki.utils.addEventListener(intersectionEl, "click", function() {
        var intersectionElement = this;
        var playedYPosition = Number(intersectionElement.getAttribute("data-position-y"));
        var playedXPosition = Number(intersectionElement.getAttribute("data-position-x"));

        board.playAt(playedYPosition, playedXPosition);
      });
    });

    board.render();
  };

  this.stateFor = function(y, x, captures) {
    var board = this;

    var moveInfo = {
      y: y,
      x: x,
      color: board.currentPlayer,
      pass: false,
      points: board.intersections.flatten().map(function(i) { return i.duplicate(); }),
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
    this.intersections[y][x].setWhite();
  };
  this.blackAt = function(y, x) {
    this.intersections[y][x].setBlack();
  };
  this.removeAt = function(y, x) {
    this.intersections[y][x].setEmpty();
  };

  this.stateForPass = function() {
    return {
      y: null,
      x: null,
      color: board.currentPlayer,
      pass: true,
      points: board.intersections.flatten().map(function(i) { return i.duplicate(); }),
      blackStonesCaptured: board.captures.black,
      whiteStonesCaptured: board.captures.white,
      capturedPositions: []
    };
  };

  this.playAt = function(y, x) {
    var board = this;

    if (board.isIllegalAt(y, x)) {
      return true;
    }

    board[board.currentPlayer + "At"](y, x);

    var captures = board.clearCapturesFor(y, x);

    board.moves.push(board.stateFor(y, x, captures));
    board.render();
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

  this.changePlayer = function() {
    var board = this;
    var previousPlayer = (board.currentPlayer == "black" ? "white" : "black");

    tenuki.utils.removeClass(board.element, previousPlayer + "-to-play");
    tenuki.utils.addClass(board.element, board.currentPlayer + "-to-play");
  };

  this.inAtari = function(y, x) {
    return this.libertiesAt(y, x) == 1;
  }

  this.wouldBeSuicide = function(y, x) {
    var board = this;
    var intersection = board.intersections[y][x];
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
    this.moves.push(this.stateForPass())
    this.render();
  };

  this.isKoFrom = function(y, x, captures) {
    var board = this;
    var point = board.intersections[y][x];

    return captures.length == 1 && this.groupAt(point.y, point.x).length == 1 && board.inAtari(point.y, point.x);
  };

  this.libertiesAt = function(y, x) {
    var board = this;
    var point = board.intersections[y][x];

    var emptyPoints = this.groupAt(point.y, point.x).flatMap(function(groupPoint) {
      return board.neighborsFor(groupPoint.y, groupPoint.x).filter(function(intersection) {
        return intersection.isEmpty();
      })
    });

    // this is not great, but we need a representation that will be unique-able,
    // and Y-X does the job.
    return tenuki.utils.unique(emptyPoints.map(function(emptyPoint) { return emptyPoint.y + "-" + emptyPoint.x; })).length;
  };

  this.groupAt = function(y, x, accumulated) {
    accumulated || (accumulated = []);

    var board = this;
    var point = board.intersections[y][x];

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
      neighbors.push(this.intersections[y][x - 1]);
    }

    if (x < (this.size - 1)) {
      neighbors.push(this.intersections[y][x + 1]);
    }

    if (y > 0) {
      neighbors.push(this.intersections[y - 1][x]);
    }

    if (y < (this.size - 1)) {
      neighbors.push(this.intersections[y + 1][x]);
    }

    return neighbors;
  };

  this.hasCapturesFor = function(y, x) {
    var board = this;
    var point = board.intersections[y][x];

    var capturedNeighbors = board.neighborsFor(point.y, point.x).filter(function(neighbor) {
      return !neighbor.isEmpty && !neighbor.sameColorAs(point) && board.libertiesAt(neighbor.y, neighbor.x) == 0;
    });

    return capturedNeighbors.length > 0
  };

  this.clearCapturesFor = function(y, x) {
    var board = this;
    var point = board.intersections[y][x];

    var capturedNeighbors = board.neighborsFor(point.y, point.x).filter(function(neighbor) {
      return !neighbor.isEmpty() && !neighbor.sameColorAs(point) && board.libertiesAt(neighbor.y, neighbor.x) == 0;
    });

    var capturedStones = capturedNeighbors.flatMap(function(neighbor) {
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
    var intersection = board.intersections[y][x];

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

    // TODO: this is bad, we're not fully updating the board's state to be empty,
    // e.g., ko points, which causes an issue if we ever jump back more than 1 move.
    // maybe represent the initial board state and allow moving directly back to
    // that. that way we can DRY up what means it to capture a board state
    // and just do that at the beginning
    if (!currentMove) {
      board.currentPlayer = "black";
      board.changePlayer();
      board.captures = { black: 0, white: 0 };
      return;
    }

    if (currentMove.color == "black") {
      board.currentPlayer = "white";
    } else {
      board.currentPlayer = "black";
    }
    board.changePlayer();

    currentMove.points.forEach(function(intersection) {
      board.intersections[intersection.y][intersection.x] = intersection.duplicate();
      var intersectionEl = board.grid[intersection.y][intersection.x];
      intersectionEl.className = ""; // be clear that we're removing all classes
      intersectionEl.className += " intersection";

      if (intersection.isEmpty()) {
        intersectionEl.className += " empty";
      } else {
        intersectionEl.className += " stone";

        if (intersection.isBlack()) {
          intersectionEl.className += " black";
        } else {
          intersectionEl.className += " white";
        }
      }

      if (board.wouldBeSuicide(intersection.y, intersection.x)) {
        intersectionEl.className += " suicide";
      }
    });

    if (currentMove.koPoint) {
      board.grid[currentMove.koPoint.y][currentMove.koPoint.x].className += " ko";
      board.koPoint = board.intersections[currentMove.koPoint.y][currentMove.koPoint.x];
    } else {
      board.koPoint = null;
    }

    if (currentMove.pass) {
      // no markers
    } else {
      board.grid[currentMove.y][currentMove.x].className += " marker";
    }

    board.captures = {
      black: currentMove.blackStonesCaptured,
      white: currentMove.whiteStonesCaptured
    }
    board.callbacks.postRender(board);
  };

  this.undo = function() {
    var board = this;

    if (board.moves.length == 0) {
      return;
    }

    board.moves.pop();
    board.render();
  };
};
ExampleBoardControls = function(element, board) {
  this.element = element;
  this.board = board;
  this.textInfo = null;
  this.gameInfo = null;

  this.setText = function(str) {
    this.textInfo.innerText = str;
  };

  this.updateStats = function() {
    this.gameInfo.innerText = "Move " + this.board.moves.length + ". Black stones captured: " + this.board.captures["black"] + ". White stones captured: " + this.board.captures["white"];

    var currentMove = this.board.currentMove();

    if (typeof currentMove != "undefined" && currentMove.pass) {
      this.setText(currentMove.color[0].toUpperCase() + currentMove.color.substr(1) + " passes.")
    } else {
      this.setText("");
    }
  };

  this.setup = function() {
    var controls = this;

    var passButton = document.querySelector(".pass");
    var undoButton = document.querySelector(".undo");
    var texturedButton = document.querySelector(".textured");

    tenuki.utils.addEventListener(passButton, "click", function(e) {
      e.preventDefault();

      var player = controls.board.currentPlayer;
      controls.board.pass();
      controls.updateStats();
    });

    tenuki.utils.addEventListener(undoButton, "click", function(e) {
      e.preventDefault();

      controls.board.undo();
    });

    tenuki.utils.addEventListener(texturedButton, "click", function(e) {
      e.preventDefault();

      tenuki.utils.toggleClass(controls.board.element, "textured");
    });

    var controlLinks = controls.element.querySelectorAll("a");
    for (var i = 0; i < controlLinks.length; i++) {
      var linkEl = controlLinks.item(i);

      tenuki.utils.addEventListener(linkEl, "click", function(e) {
      });
    }
  }
};
tenuki.Intersection = function(y, x, board) {
  this.y = y;
  this.x = x;
  this.value = "empty";
  this.board = board;

  this.duplicate = function() {
    var duplicateIntersection = new tenuki.Intersection(this.y, this.x, this.board);
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
tenuki.utils = {
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
