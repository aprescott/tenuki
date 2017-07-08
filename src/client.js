import Game from "./game";

const Client = function(options = {}) {
  this._boardElement = options["element"];
  this._setup(options);
};

Client.prototype = {
  _setup: function({ player, gameOptions, hooks }) {
    this._player = player;
    this._hooks = hooks;

    if (this._player !== "black" && this._player !== "white") {
      throw new Error("Player must be either black or white, but was given: " + this._player);
    }

    gameOptions["_hooks"] = {
      handleClick: (y, x) => {
        if (this._busy) {
          return;
        }

        this._busy = true;

        if (this.isOver()) {
          const stonesToBeMarkedDead = this._game.currentState().groupAt(y, x).map(i => {
            return {
              y: i.y,
              x: i.x,
              color: i.color
            };
          });

          this._hooks.submitMarkDeadAt(y, x, stonesToBeMarkedDead, result => {
            if (result) {
              this._game.toggleDeadAt(y, x);
            }

            this._busy = false;
          });
        } else {
          if (this._player !== this.currentPlayer() || this._game.isIllegalAt(y, x)) {
            this._busy = false;

            return;
          }

          this._hooks.submitPlay(y, x, result => {
            if (result) {
              this._game.playAt(y, x);
            }

            this._busy = false;
          });
        }
      },

      hoverValue: (y, x) => {
        if (!this._busy && this._player === this.currentPlayer() && !this.isOver() && !this._game.isIllegalAt(y, x)) {
          return this._player;
        }
      },

      gameIsOver: () => {
        return this.isOver();
      }
    };

    if (this._boardElement) {
      this._game = new Game(Object.assign({ element: this._boardElement }, gameOptions));
    } else {
      this._game = new Game(...gameOptions);
    }
  },

  isOver: function() {
    return this._game.isOver();
  },

  currentPlayer: function() {
    return this._game.currentPlayer();
  },

  receivePlay: function(y, x) {
    if (this._player === this.currentPlayer()) {
      return;
    }

    this._game.playAt(y, x);
  },

  moveNumber: function() {
    return this._game.moveNumber();
  },

  receivePass: function() {
    if (this._player === this.currentPlayer()) {
      return;
    }

    this._game.pass();
  },

  receiveMarkDeadAt: function(y, x) {
    this._game.toggleDeadAt(y, x);
  },

  deadStones: function() {
    return this._game.deadStones();
  },

  setDeadStones: function(points) {
    this._game._deadPoints = points.map(i => {
      return {
        y: i.y,
        x: i.x
      };
    });

    this._game.render();
  },

  pass: function() {
    if (this._busy || this._player !== this.currentPlayer() || this.isOver()) {
      return;
    }

    this._busy = true;

    this._hooks.submitPass(result => {
      if (result) {
        this._game.pass();
      }

      this._busy = false;
    });
  }
};

export default Client;
