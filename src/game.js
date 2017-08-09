import DOMRenderer from "./dom-renderer";
import SVGRenderer from "./svg-renderer";
import NullRenderer from "./null-renderer";
import BoardState from "./board-state";
import Ruleset from "./ruleset";
import Scorer from "./scorer";

const VALID_GAME_OPTIONS = [
  "element",
  "boardSize",
  "scoring",
  "handicapStones",
  "koRule",
  "komi",
  "_hooks",
  "fuzzyStonePlacement",
  "renderer",
  "freeHandicapPlacement"
];

const Game = function(options = {}) {
  this._validateOptions(options);

  this._defaultBoardSize = 19;
  this.boardSize = null;
  this._moves = [];
  this.callbacks = {
    postRender: function() {}
  };
  this._boardElement = options["element"];
  this._defaultScoring = "territory";
  this._defaultKoRule = "simple";
  this._defaultRenderer = "svg";
  this._deadPoints = [];

  this._setup(options);
};

Game.prototype = {
  _validateOptions: function(options) {
    for (let key in options) {
      if (options.hasOwnProperty(key)) {
        if (VALID_GAME_OPTIONS.indexOf(key) < 0) {
          throw new Error("Unrecognized game option: " + key);
        }

        if (typeof options[key] === "undefined" || options[key] === null) {
          throw new Error(`Game option ${key} must not be set as null or undefined`);
        }
      }
    }
  },

  _configureOptions: function({ boardSize = this._defaultBoardSize, komi = 0, handicapStones = 0, freeHandicapPlacement = false, scoring = this._defaultScoring, koRule = this._defaultKoRule, renderer = this._defaultRenderer } = {}) {
    if (typeof boardSize !== "number") {
      throw new Error("Board size must be a number, but was: " + typeof boardSize);
    }

    if (typeof handicapStones !== "number") {
      throw new Error("Handicap stones must be a number, but was: " + typeof boardSize);
    }

    if (handicapStones > 0 && boardSize !== 9 && boardSize !== 13 && boardSize !== 19) {
      throw new Error("Handicap stones not supported on sizes other than 9x9, 13x13 and 19x19");
    }

    if (handicapStones < 0 || handicapStones === 1 || handicapStones > 9) {
      throw new Error("Only 2 to 9 handicap stones are supported");
    }

    if (boardSize > 19) {
      throw new Error("cannot generate a board size greater than 19");
    }

    this.boardSize = boardSize;
    this.handicapStones = handicapStones;
    this._freeHandicapPlacement = freeHandicapPlacement;

    this._scorer = new Scorer({
      scoreBy: scoring,
      komi: komi
    });

    this._rendererChoice = {
      "dom": DOMRenderer,
      "svg": SVGRenderer
    }[renderer];

    if (!this._rendererChoice) {
      throw new Error("Unknown renderer: " + renderer);
    }

    this._ruleset = new Ruleset({
      koRule: koRule
    });

    if (this._freeHandicapPlacement) {
      this._initialState = BoardState._initialFor(boardSize, 0);
    } else {
      this._initialState = BoardState._initialFor(boardSize, handicapStones);
    }
  },

  _stillPlayingHandicapStones: function() {
    return this._freeHandicapPlacement && this.handicapStones > 0 && this._moves.length < this.handicapStones;
  },

  _setup: function(options = {}) {
    this._validateOptions(options);
    this._configureOptions(options);

    if (this._boardElement) {
      const defaultRendererHooks = {
        handleClick: (y, x) => {
          if (this.isOver()) {
            this.toggleDeadAt(y, x);
          } else {
            this.playAt(y, x);
          }
        },

        hoverValue: (y, x) => {
          if (!this.isOver() && !this.isIllegalAt(y, x)) {
            return this.currentPlayer();
          }
        },

        gameIsOver: () => {
          return this.isOver();
        }
      };

      this.renderer = new this._rendererChoice(this._boardElement, {
        hooks: options["_hooks"] || defaultRendererHooks,
        options: {
          fuzzyStonePlacement: options["fuzzyStonePlacement"]
        }
      });
    } else {
      this.renderer = new NullRenderer();
    }

    this.render();
  },

  intersectionAt: function(y, x) {
    return this.currentState().intersectionAt(y, x);
  },

  intersections: function() {
    return this.currentState().intersections;
  },

  deadStones: function() {
    return this._deadPoints;
  },

  coordinatesFor: function(y, x) {
    return this.currentState().xCoordinateFor(x) + this.currentState().yCoordinateFor(y);
  },

  currentPlayer: function() {
    if (this._stillPlayingHandicapStones()) {
      return "black";
    }

    return this.currentState().nextColor();
  },

  isWhitePlaying: function() {
    return this.currentPlayer() === "white";
  },

  isBlackPlaying: function() {
    return this.currentPlayer() === "black";
  },

  score: function() {
    return this._scorer.score(this);
  },

  currentState: function() {
    return this._moves[this._moves.length - 1] || this._initialState;
  },

  moveNumber: function() {
    return this.currentState().moveNumber;
  },

  playAt: function(y, x, { render = true } = {}) {
    if (this.isIllegalAt(y, x)) {
      return false;
    }

    let newState = this.currentState().playAt(y, x, this.currentPlayer());
    const { koPoint } = newState;

    if (koPoint && !this._ruleset._isKoViolation(koPoint.y, koPoint.x, newState, this._moves.concat(newState))) {
      newState = newState.copyWithAttributes({ koPoint: null });
    }

    this._moves.push(newState);

    if (render) {
      this.render();
    }

    return true;
  },

  pass: function({ render = true } = {}) {
    if (this.isOver()) {
      return false;
    }

    const newState = this.currentState().playPass(this.currentPlayer());
    this._moves.push(newState);

    if (render) {
      this.render();
    }

    return true;
  },

  isOver: function() {
    if (this._moves.length < 2) {
      return false;
    }

    const finalMove = this._moves[this._moves.length - 1];
    const previousMove = this._moves[this._moves.length - 2];

    return finalMove.pass && previousMove.pass;
  },

  markDeadAt: function(y, x, { render = true } = {}) {
    if (this._isDeadAt(y, x)) {
      return true;
    }

    return this._setDeadStatus(y, x, true, { render });
  },

  unmarkDeadAt: function(y, x, { render = true } = {}) {
    if (!this._isDeadAt(y, x)) {
      return true;
    }

    return this._setDeadStatus(y, x, false, { render });
  },

  toggleDeadAt: function(y, x, { render = true } = {}) {
    return this._setDeadStatus(y, x, !this._isDeadAt(y, x), { render });
  },

  _setDeadStatus: function(y, x, markingDead, { render = true } = {}) {
    const selectedIntersection = this.intersectionAt(y, x);

    if (selectedIntersection.isEmpty()) {
      return;
    }

    const chosenDead = [];

    const [candidates] = this.currentState().partitionTraverse(selectedIntersection, intersection => {
      return intersection.isEmpty() || intersection.sameColorAs(selectedIntersection);
    });

    candidates.forEach(sameColorOrEmpty => {
      if (!sameColorOrEmpty.isEmpty()) {
        chosenDead.push(sameColorOrEmpty);
      }
    });

    chosenDead.forEach(intersection => {
      if (markingDead) {
        this._deadPoints.push({ y: intersection.y, x: intersection.x });
      } else {
        this._deadPoints = this._deadPoints.filter(dead => !(dead.y === intersection.y && dead.x === intersection.x));
      }
    });

    if (render) {
      this.render();
    }

    return true;
  },

  _isDeadAt: function(y, x) {
    return this._deadPoints.some(dead => dead.y === y && dead.x === x);
  },

  isIllegalAt: function(y, x) {
    return this._ruleset.isIllegal(y, x, this);
  },

  territory: function() {
    if (!this.isOver()) {
      return {
        black: [],
        white: []
      };
    }

    return this._scorer.territory(this);
  },

  undo: function() {
    this._moves.pop();
    this.render();
  },

  render: function() {
    if (!this.isOver()) {
      this._deadPoints = [];
    }

    this.renderer.render(this.currentState(), {
      territory: this.territory(),
      deadStones: this.deadStones()
    });

    this.callbacks.postRender(this);
  }
};

export default Game;
