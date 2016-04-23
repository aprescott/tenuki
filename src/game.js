import utils from "./utils";
import DOMRenderer from "./dom-renderer";
import NullRenderer from "./null-renderer";
import Intersection from "./intersection";
import Scorer from "./scorer";
import GameState from "./game-state";

const Game = function(boardElement) {
  this._defaultBoardSize = 19;
  this.boardSize = null;
  this.moves = [];
  this.renderer = (boardElement ? new DOMRenderer(this, boardElement) : new NullRenderer());
  this.callbacks = {
    postRender: function() {}
  };
  this.deadPoints = [];
};

Game.prototype = {
  _configureOptions: function({ boardSize = this._defaultBoardSize } = {}) {
    this.boardSize = boardSize;
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
    return this.currentMove().intersectionAt(y, x);
  },

  intersections: function() {
    return this.currentMove().points;
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

  currentPlayer: function() {
    return this.currentMove()._nextColor();
  },

  playAt: function(y, x) {
    if (this.isIllegalAt(y, x)) {
      return false;
    }

    this.moves.push(this.currentMove().playAt(y, x, this));
    this.render();

    return true;
  },

  currentMove: function() {
    return this.moves[this.moves.length - 1] || GameState.initialFor(this.boardSize);
  },

  isWhitePlaying: function() {
    return this.currentPlayer() == "white";
  },

  isBlackPlaying: function() {
    return this.currentPlayer() == "black";
  },

  inAtari: function(y, x) {
    return this.libertiesAt(y, x) == 1;
  },

  wouldBeSuicide: function(y, x) {
    const intersection = this.intersectionAt(y, x);
    const surroundedEmptyPoint = intersection.isEmpty() && this.neighborsFor(intersection.y, intersection.x).filter(neighbor => neighbor.isEmpty()).length == 0;

    if (!surroundedEmptyPoint) {
      return false;
    }

    let suicide = true;

    const someFriendlyNotInAtari = this.neighborsFor(intersection.y, intersection.x).some(neighbor => {
      const inAtari = this.inAtari(neighbor.y, neighbor.x);
      const friendly = neighbor.isOccupiedWith(this.currentPlayer());

      return friendly && !inAtari;
    });

    if (someFriendlyNotInAtari) {
      suicide = false;
    }

    const someEnemyInAtari = this.neighborsFor(intersection.y, intersection.x).some(neighbor => {
      const inAtari = this.inAtari(neighbor.y, neighbor.x);
      const enemy = !neighbor.isOccupiedWith(this.currentPlayer());

      return enemy && inAtari;
    });

    if (someEnemyInAtari) {
      suicide = false;
    }

    return suicide;
  },

  pass: function() {
    if (!this.isOver()) {
      this.moves.push(this.currentMove().playPass())
      this.render();
    }
  },

  isOver: function() {
    if (this.moves.length < 2) {
      return false;
    }

    const currentMove = this.currentMove();
    const previousMove = this.moves[this.moves.length - 2];

    return currentMove.pass && previousMove.pass;
  },

  toggleDeadAt: function(y, x) {
    const alreadyDead = this.isDeadAt(y, x);

    this.groupAt(y, x).forEach(intersection => {
      if (alreadyDead) {
        this.deadPoints = this.deadPoints.filter(dead => !(dead.y == intersection.y && dead.x == intersection.x));
      } else {
        this.deadPoints.push({ y: intersection.y, x: intersection.x });
      }
    });

    this.render();
  },

  isDeadAt: function(y, x) {
    return this.deadPoints.some(dead => dead.y == y && dead.x == x);
  },

  territoryScore: function() {
    return Scorer.territoryResultFor(this);
  },

  areaScore: function() {
    return Scorer.areaResultFor(this);
  },

  libertiesAt: function(y, x) {
    return this.currentMove().libertiesAt(y, x);
  },

  groupAt: function(y, x) {
    return this.currentMove().groupAt(y, x);
  },

  neighborsFor: function(y, x) {
    return this.currentMove().neighborsFor(y, x);
  },

  hasCapturesFor: function(y, x) {
    const point = this.intersectionAt(y, x);

    const capturedNeighbors = this.neighborsFor(point.y, point.x).filter(neighbor => {
      return !neighbor.isEmpty && !neighbor.sameColorAs(point) && this.libertiesAt(neighbor.y, neighbor.x) == 0;
    });

    return capturedNeighbors.length > 0
  },

  isIllegalAt: function(y, x) {
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
  },

  render: function() {
    const currentMove = this.currentMove();

    if (!this.isOver()) {
      this.removeScoringState();
    }

    this.renderer.render();
    this.callbacks.postRender(this);
  },

  removeScoringState: function() {
    this.deadPoints = [];
  },

  territory: function() {
    if (!this.isOver()) {
      return;
    }

    return this.currentMove().territory(this);
  },

  undo: function() {
    this.moves.pop();
    this.render();
  }
};

export default Game;
