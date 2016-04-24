import utils from "./utils";
import DOMRenderer from "./dom-renderer";
import NullRenderer from "./null-renderer";
import Intersection from "./intersection";
import Scorer from "./scorer";
import BoardState from "./board-state";

const Game = function(boardElement) {
  this._defaultBoardSize = 19;
  this.boardSize = null;
  this._moves = [];
  this.renderer = (boardElement ? new DOMRenderer(this, boardElement) : new NullRenderer());
  this.callbacks = {
    postRender: function() {}
  };
  this._deadPoints = [];
};

Game.prototype = {
  _configureOptions: function({ boardSize = this._defaultBoardSize, handicapStones = 0 } = {}) {
    if (handicapStones > 0 && boardSize != 9 && boardSize != 13 && boardSize != 19) {
      throw new Error("Handicap stones not supported on sizes other than 9x9, 13x13 and 19x19");
    }

    if (handicapStones < 0 || handicapStones == 1 || handicapStones > 9) {
      throw new Error("Only 2 to 9 handicap stones are supported");
    }

    this.boardSize = boardSize;
    this.handicapStones = handicapStones;
  },

  setup: function(options) {
    this._configureOptions(options);

    if (this.boardSize > 19) {
      throw "cannot generate a board size greater than 19";
    }

    this.renderer.setup();
    this.render();
  },

  intersectionAt: function(y, x) {
    return this.boardState().intersectionAt(y, x);
  },

  intersections: function() {
    return this.boardState().points;
  },

  yCoordinateFor: function(y) {
    return this.boardSize - y;
  },

  xCoordinateFor: function(x) {
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"];

    return letters[x];
  },

  coordinatesFor: function(y, x) {
    return this.xCoordinateFor(x) + this.yCoordinateFor(y);
  },

  // TODO: boardState().color != currentPlayer() and this is weird.
  currentPlayer: function() {
    return this.boardState()._nextColor();
  },

  playAt: function(y, x) {
    if (this.isIllegalAt(y, x)) {
      return false;
    }

    this._moves.push(this.boardState().playAt(y, x));
    this.render();

    return true;
  },

  boardState: function() {
    return this._moves[this._moves.length - 1] || BoardState._initialFor(this.boardSize, this.handicapStones);
  },

  isWhitePlaying: function() {
    return this.currentPlayer() == "white";
  },

  isBlackPlaying: function() {
    return this.currentPlayer() == "black";
  },

  inAtari: function(y, x) {
    return this.boardState().inAtari(y, x);
  },

  wouldBeSuicide: function(y, x) {
    const intersection = this.intersectionAt(y, x);
    const surroundedEmptyPoint = intersection.isEmpty() && this.neighborsFor(intersection.y, intersection.x).filter(neighbor => neighbor.isEmpty()).length == 0;

    if (!surroundedEmptyPoint) {
      return false;
    }

    const someFriendlyNotInAtari = this.neighborsFor(intersection.y, intersection.x).some(neighbor => {
      const inAtari = this.inAtari(neighbor.y, neighbor.x);
      const friendly = neighbor.isOccupiedWith(this.currentPlayer());

      return friendly && !inAtari;
    });

    if (someFriendlyNotInAtari) {
      return false;
    }

    const someEnemyInAtari = this.neighborsFor(intersection.y, intersection.x).some(neighbor => {
      const inAtari = this.inAtari(neighbor.y, neighbor.x);
      const enemy = !neighbor.isOccupiedWith(this.currentPlayer());

      return enemy && inAtari;
    });

    if (someEnemyInAtari) {
      return false;
    }

    return true;
  },

  pass: function() {
    if (!this.isOver()) {
      this._moves.push(this.boardState().playPass())
      this.render();
    }
  },

  isOver: function() {
    if (this._moves.length < 2) {
      return false;
    }

    const boardState = this.boardState();
    const previousMove = this._moves[this._moves.length - 2];

    return boardState.pass && previousMove.pass;
  },

  toggleDeadAt: function(y, x) {
    const alreadyDead = this.isDeadAt(y, x);

    this.groupAt(y, x).forEach(intersection => {
      if (alreadyDead) {
        this._deadPoints = this._deadPoints.filter(dead => !(dead.y == intersection.y && dead.x == intersection.x));
      } else {
        this._deadPoints.push({ y: intersection.y, x: intersection.x });
      }
    });

    this.render();
  },

  isDeadAt: function(y, x) {
    return this._deadPoints.some(dead => dead.y == y && dead.x == x);
  },

  territoryScore: function() {
    return Scorer.territoryResultFor(this);
  },

  areaScore: function() {
    return Scorer.areaResultFor(this);
  },

  libertiesAt: function(y, x) {
    return this.boardState().libertiesAt(y, x);
  },

  groupAt: function(y, x) {
    return this.boardState().groupAt(y, x);
  },

  neighborsFor: function(y, x) {
    return this.boardState().neighborsFor(y, x);
  },

  hasCapturesFor: function(y, x) {
    const point = this.intersectionAt(y, x);

    const capturedNeighbors = this.neighborsFor(point.y, point.x).filter(neighbor => {
      return !neighbor.isEmpty && !neighbor.sameColorAs(point) && this.libertiesAt(neighbor.y, neighbor.x) == 0;
    });

    return capturedNeighbors.length > 0
  },

  isIllegalAt: function(y, x) {
    if (this._moves.length == 0) {
      return false;
    }

    const intersection = this.intersectionAt(y, x);
    const isEmpty = intersection.isEmpty();
    const isCapturing = this.hasCapturesFor(y, x);
    const isSuicide = this.wouldBeSuicide(y, x);
    const koPoint = this.boardState().koPoint;
    const isKoViolation = koPoint && koPoint.y == y && koPoint.x == x;

    return !isEmpty || isKoViolation || (isSuicide && !isCapturing);
  },

  render: function() {
    const boardState = this.boardState();

    if (!this.isOver()) {
      this.removeScoringState();
    }

    this.renderer.render();
    this.callbacks.postRender(this);
  },

  removeScoringState: function() {
    this._deadPoints = [];
  },

  territory: function() {
    if (!this.isOver()) {
      return;
    }

    return this.boardState().territory(this);
  },

  undo: function() {
    this._moves.pop();
    this.render();
  }
};

export default Game;
