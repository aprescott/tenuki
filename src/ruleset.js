const VALID_KO_OPTIONS = [
  "simple",
  "superko"
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
    const nextColor = game.currentPlayer();
    const intersection = boardState.intersectionAt(y, x);

    const result = !intersection.isEmpty() ||
      this._wouldBeSuicide(y, x, nextColor, boardState) ||
      this._isKoViolation(y, x, nextColor, boardState, game._moves);

    return result;
  },

  _isKoViolation: function(y, x, color, boardState, existingStates) {
    let isKoViolation = false;

    if (this.koRule === "simple") {
      const koPoint = boardState.koPoint;
      isKoViolation = koPoint && koPoint.y === y && koPoint.x === x;
    } else {
      const newState = boardState.playAt(y, x, color);
      const boardStates = existingStates;

      isKoViolation = existingStates.length > 0 && boardStates.some(existingState => {
        return existingState.positionSameAs(newState);
      });
    }

    return isKoViolation;
  },

  _wouldBeSuicide: function(y, x, color, boardState) {
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
