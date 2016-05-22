import { AreaScoring, TerritoryScoring } from "./scoring";

const Ruleset = function({ scoring } = {}) {
  this.scorer = {
    "area": AreaScoring,
    "territory": TerritoryScoring
  }[scoring];

  if (!this.scorer) {
    throw new Error("Unknown scoring: " + scoring);
  }

  Object.freeze(this);
};

Ruleset.prototype = {
  isIllegal: function(y, x, boardState) {
    const intersection = boardState.intersectionAt(y, x);
    const isEmpty = intersection.isEmpty();
    const isSuicide = boardState.wouldBeSuicide(y, x);
    const koPoint = boardState.koPoint;
    const isKoViolation = koPoint && koPoint.y === y && koPoint.x === x;

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
