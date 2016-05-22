import { AreaScoring, TerritoryScoring } from "./scoring";

const VALID_KO_OPTIONS = [
  "simple",
  "superko"
];

const Ruleset = function({ scoring, koRule } = {}) {
  this.scorer = {
    "area": AreaScoring,
    "territory": TerritoryScoring
  }[scoring];
  this.koRule = koRule;

  if (!this.scorer) {
    throw new Error("Unknown scoring: " + scoring);
  }

  if (VALID_KO_OPTIONS.indexOf(this.koRule) < 0) {
    throw new Error("Unknown ko rule: " + koRule);
  }

  Object.freeze(this);
};

Ruleset.prototype = {
  isIllegal: function(y, x, game) {
    const boardState = game.boardState();
    const intersection = boardState.intersectionAt(y, x);
    const isEmpty = intersection.isEmpty();
    const isSuicide = boardState.wouldBeSuicide(y, x);

    let isKoViolation = false;

    if (this.koRule === "simple") {
      const koPoint = boardState.koPoint;
      isKoViolation = koPoint && koPoint.y === y && koPoint.x === x;
    } else {
      const newState = boardState.playAt(y, x);
      const boardStates = game._moves;

      isKoViolation = game._moves.length > 0 && boardStates.some(existingState => {
        return existingState.positionSameAs(newState);
      });
    }

    return !isEmpty || isKoViolation || isSuicide;
  },

  territory: function(game) {
    return this.scorer.territory(game);
  },

  score: function(game) {
    return this.scorer.score(game);
  }
};

export default Ruleset;
