const VALID_KO_OPTIONS = [
  "simple",
  "positional-superko",
  "situational-superko",
  "natural-situational-superko"
];

const Ruleset = function({ koRule }) {
  this.koRule = koRule;

  if (VALID_KO_OPTIONS.indexOf(this.koRule) < 0) {
    throw new Error("Unknown ko rule: " + koRule);
  }

  Object.freeze(this);
};

Ruleset.prototype = {
  isIllegal: function(y, x, game) {
    const boardState = game.currentState();
    const intersection = boardState.intersectionAt(y, x);

    const result = !intersection.isEmpty() ||
      this._wouldBeSuicide(y, x, boardState) ||
      this._isKoViolation(y, x, boardState, game._moves);

    return result;
  },

  _isKoViolation: function(y, x, boardState, existingStates) {
    let isKoViolation = false;

    if (this.koRule === "simple") {
      const simpleKoPoint = boardState._simpleKoPoint();
      isKoViolation = Boolean(simpleKoPoint) && y === simpleKoPoint.y && x === simpleKoPoint.x;
    } else {
      const newState = boardState.playAt(y, x, boardState.nextColor());

      const hasDuplicatePosition = (condition) => {
        return existingStates.length > 0 && existingStates.some(existingState => {
          return condition(existingState) && existingState.positionSameAs(newState);
        });
      };

      if (this.koRule === "positional-superko") {
        isKoViolation = hasDuplicatePosition(() => true);
      } else if (this.koRule === "situational-superko") {
        isKoViolation = hasDuplicatePosition((state) => {
          return state.color === newState.color;
        });
      } else if (this.koRule === "natural-situational-superko") {
        isKoViolation = hasDuplicatePosition((state) => {
          return !state.pass && state.color === newState.color;
        });
      } else {
        throw new Error(`Unimplemented ko rule ${this.koRule}`);
      }
    }

    return isKoViolation;
  },

  _wouldBeSuicide: function(y, x, boardState) {
    const color = boardState.nextColor();
    const intersection = boardState.intersectionAt(y, x);
    const surroundedEmptyPoint = intersection.isEmpty() && boardState.neighborsFor(intersection.y, intersection.x).filter(neighbor => neighbor.isEmpty()).length === 0;

    if (!surroundedEmptyPoint) {
      return false;
    }

    const someFriendlyNotInAtari = boardState.neighborsFor(intersection.y, intersection.x).some(neighbor => {
      const inAtari = boardState.inAtari(neighbor.y, neighbor.x);
      const friendly = neighbor.isOccupiedWith(color);

      return friendly && !inAtari;
    });

    if (someFriendlyNotInAtari) {
      return false;
    }

    const someEnemyInAtari = boardState.neighborsFor(intersection.y, intersection.x).some(neighbor => {
      const inAtari = boardState.inAtari(neighbor.y, neighbor.x);
      const enemy = !neighbor.isOccupiedWith(color);

      return enemy && inAtari;
    });

    if (someEnemyInAtari) {
      return false;
    }

    return true;
  }
};

export default Ruleset;
