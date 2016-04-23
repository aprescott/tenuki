import utils from "./utils";
import DOMRenderer from "./dom-renderer";
import NullRenderer from "./null-renderer";
import Intersection from "./intersection";
import Scorer from "./scorer";
import GameState from "./game-state";

export default function Game(boardElement) {
  this._defaultBoardSize = 19;
  this.boardSize = null;
  this._intersectionGrid = [];
  this.currentPlayer = "black";
  this.moves = [];
  this.renderer = (boardElement ? new DOMRenderer(this, boardElement) : new NullRenderer());
  this.callbacks = {
    postRender: function() {}
  };
  this.deadPoints = [];

  this._configureOptions = function({ boardSize = this._defaultBoardSize } = {}) {
    this.boardSize = boardSize;
  };

  this.setup = function(options) {
    this._configureOptions(options);

    if (this.boardSize > 19) {
      throw "cannot generate a board size greater than 19";
    }

    this.renderer.setup();

    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        const intersection = new Intersection(y, x);
        this._intersectionGrid[y] || (this._intersectionGrid[y] = []);
        this._intersectionGrid[y][x] = intersection;
      }
    }

    this.render();
  };

  this.intersectionAt = function(y, x) {
    // TODO: should there be a specific state (through currentState()?)
    // that describes the empty board so that this sort of check isn't
    // necessary and that way we don't need to rely on _intersectionGrid ?
    if (this.currentMove()) {
      return this.currentMove().intersectionAt(y, x);
    } else {
      return this._intersectionGrid[y][x];
    }
  };

  this.intersections = function() {
    if (this.currentMove()) {
      return this.currentMove().points;
    } else {
      return utils.flatten(this._intersectionGrid);
    }
  };

  this.yCoordinateFor = function(y) {
    return this.boardSize - y;
  };

  this.xCoordinateFor = function(x) {
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"];

    return letters[x];
  };

  this.coordinatesFor = function(y, x) {
    return this.xCoordinateFor(x) + this.yCoordinateFor(y);
  };

  this.stateFor = function(y, x, captures) {
    return GameState.forPlay(this, y, x, captures);
  };

  this.whiteAt = function(y, x) {
    this._intersectionGrid[y][x].setWhite();
  };
  this.blackAt = function(y, x) {
    this._intersectionGrid[y][x].setBlack();
  };
  this.removeAt = function(y, x) {
    this._intersectionGrid[y][x].setEmpty();
  };

  this.stateForPass = function() {
    return GameState.forPass(this);
  };

  this.playAt = function(y, x) {
    if (this.isIllegalAt(y, x)) {
      return false;
    }

    this[this.currentPlayer + "At"](y, x);

    const captures = this.clearCapturesFor(y, x);

    this.moves.push(this.stateFor(y, x, captures));
    this.render();

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
    const intersection = this.intersectionAt(y, x);
    const surroundedEmptyPoint = intersection.isEmpty() && this.neighborsFor(intersection.y, intersection.x).filter(neighbor => neighbor.isEmpty()).length == 0;

    if (!surroundedEmptyPoint) {
      return false;
    }

    let suicide = true;

    const friendlyNeighbors = this.neighborsFor(intersection.y, intersection.x).filter(neighbor => neighbor.isOccupiedWith(this.currentPlayer));

    const someFriendlyNotInAtari = this.neighborsFor(intersection.y, intersection.x).some(neighbor => {
      const inAtari = this.inAtari(neighbor.y, neighbor.x);
      const friendly = neighbor.isOccupiedWith(this.currentPlayer);

      return friendly && !inAtari;
    });

    if (someFriendlyNotInAtari) {
      suicide = false;
    }

    const someEnemyInAtari = this.neighborsFor(intersection.y, intersection.x).some(neighbor => {
      const inAtari = this.inAtari(neighbor.y, neighbor.x);
      const enemy = !neighbor.isOccupiedWith(this.currentPlayer);

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

    const currentMove = this.currentMove();
    const previousMove = this.moves[this.moves.length - 2];

    return currentMove.pass && previousMove.pass;
  };

  this.toggleDeadAt = function(y, x) {
    const alreadyDead = this.isDeadAt(y, x);

    this.groupAt(y, x).forEach(intersection => {
      if (alreadyDead) {
        this.deadPoints = this.deadPoints.filter(dead => !(dead.y == intersection.y && dead.x == intersection.x));
      } else {
        this.deadPoints.push({ y: intersection.y, x: intersection.x });
      }
    });

    this.render();
  }

  this.isDeadAt = function(y, x) {
    return this.deadPoints.some(dead => dead.y == y && dead.x == x);
  };

  this.territoryScore = function() {
    return Scorer.territoryResultFor(this);
  };

  this.areaScore = function() {
    return Scorer.areaResultFor(this);
  };

  this.libertiesAt = function(y, x) {
    const point = this.intersectionAt(y, x);

    const emptyPoints = utils.flatMap(this.groupAt(point.y, point.x), groupPoint => {
      return this.neighborsFor(groupPoint.y, groupPoint.x).filter(intersection => intersection.isEmpty());
    });

    // this is not great, but we need a representation that will be unique-able,
    // and Y-X does the job.
    return utils.unique(emptyPoints.map(emptyPoint => emptyPoint.y + "-" + emptyPoint.x)).length;
  };

  this.groupAt = function(y, x) {
    return this.currentMove().groupAt(y, x);
  };

  this.neighborsFor = function(y, x) {
    return this.currentMove().neighborsFor(y, x);
  };

  this.hasCapturesFor = function(y, x) {
    // TODO:
    if (!this.currentMove()) {
      return false;
    }

    const point = this.intersectionAt(y, x);

    const capturedNeighbors = this.neighborsFor(point.y, point.x).filter(neighbor => {
      return !neighbor.isEmpty && !neighbor.sameColorAs(point) && this.libertiesAt(neighbor.y, neighbor.x) == 0;
    });

    return capturedNeighbors.length > 0
  };

  this.clearCapturesFor = function(y, x) {
    // TODO:
    if (!this.currentMove()) {
      return [];
    }

    const point = this._intersectionGrid[y][x];

    const capturedNeighbors = this.neighborsFor(point.y, point.x).filter(neighbor => {
      // TODO: this value of 1 is potentially weird.
      // we're checking against the move before the stone we just played
      // where this space is not occupied yet. things should possibly be
      // reworked.
      return !neighbor.isEmpty() && !neighbor.sameColorAs(point) && this.libertiesAt(neighbor.y, neighbor.x) == 1;
    });

    const capturedStones = utils.flatMap(capturedNeighbors, neighbor => this.groupAt(neighbor.y, neighbor.x));

    capturedStones.forEach(capturedStone => {
      this.removeAt(capturedStone.y, capturedStone.x);
    });

    return capturedStones;
  };

  this.isIllegalAt = function(y, x) {
    if (this.moves.length == 0) {
      return false;
    }

    const intersection = this.intersectionAt(y, x);
    const isEmpty = intersection.isEmpty();
    const isCapturing = this.hasCapturesFor(y, x);
    const isSuicide = this.wouldBeSuicide(y, x);
    const koPoint = this.currentMove().koPoint;
    const isKoViolation = koPoint && koPoint.y == y && koPoint.x == x;

    return !isEmpty || isKoViolation || (isSuicide && !isCapturing);
  };

  this.render = function() {
    const currentMove = this.currentMove();

    if (!this.isOver()) {
      this.removeScoringState();
    }

    const points = currentMove ? currentMove.points : this.intersections();

    points.forEach(intersection => {
      if (!currentMove) {
        intersection.setEmpty();
      }

      this._intersectionGrid[intersection.y][intersection.x] = intersection.duplicate();
    });

    if (!currentMove) {
      this.currentPlayer = "black";
    } else {
      if (currentMove.color == "black") {
        this.currentPlayer = "white";
      } else {
        this.currentPlayer = "black";
      }
    }

    this.renderer.render();
    this.callbacks.postRender(this);
  };

  this.removeScoringState = function() {
    this.deadPoints = [];
  };

  this.territory = function() {
    if (!this.isOver()) {
      return;
    }

    return this.currentMove().territory(this);
  };

  this.undo = function() {
    this.moves.pop();
    this.render();
  };
};
