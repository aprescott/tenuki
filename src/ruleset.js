import { AreaScoring, TerritoryScoring } from "./scoring";

const VALID_KO_OPTIONS = [
  "simple"
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
