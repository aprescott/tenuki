import utils from "./utils";
import Intersection from "./intersection";
import Region from "./region";
import EyePoint from "./eye-point";

const boardStateWithoutDeadPoints = function(game) {
  return game.currentState()._withoutIntersectionsMatching(i => {
    return game._isDeadAt(i.y, i.x);
  });
};

const boardStateWithoutNeutralPoints = function(boardState) {
  const regions = Region.allFor(boardState);
  const neutralRegions = regions.filter(r => r.isNeutral());

  if (regions.length === 0 || neutralRegions.length === 0) {
    return boardState;
  }

  const replacements = {};

  neutralRegions.forEach(r => {
    let startingX = null;
    let startingY = null;

    r.intersections.forEach(intersection => {
      startingX = startingX || intersection.x;
      startingX = startingX || intersection.y;

      const manhattanDistance = Math.abs(intersection.y - startingY) + Math.abs(intersection.x - startingX);
      const replacementColor = ["black", "white"][manhattanDistance % 2];
      const replacement = new Intersection(intersection.y, intersection.x, replacementColor);

      replacements[intersection.y] = replacements[intersection.y] || [];
      replacements[intersection.y][intersection.x] = replacement;
    });
  });

  const newPoints = boardState.intersections.map(i => {
    if (replacements[i.y] && replacements[i.y][i.x]) {
      return replacements[i.y][i.x];
    } else {
      return i;
    }
  });

  return boardState._withNewPoints(newPoints);
};

const boardStateWithClearFalseEyesFilled = function(boardState) {
  const territoryRegions = Region.allFor(boardState).filter(r => r.isTerritory());
  const falseEyePoints = utils.flatMap(territoryRegions, r => r.intersections).filter(i => (new EyePoint(boardState, i)).isFalse());

  let pointsNeighboringAtari = falseEyePoints.filter(i => {
    return boardState.neighborsFor(i.y, i.x).some(n => boardState.inAtari(n.y, n.x));
  });
  let neutralAtariUpdatedState = boardState;

  while (pointsNeighboringAtari.length > 0) {
    const newPoints = neutralAtariUpdatedState.intersections.map(i => {
      if (pointsNeighboringAtari.indexOf(i) > -1) {
        return new Intersection(i.y, i.x, (new EyePoint(neutralAtariUpdatedState, i)).filledColor());
      } else {
        return i;
      }
    });
    neutralAtariUpdatedState = neutralAtariUpdatedState._withNewPoints(newPoints);

    const boardState = boardStateWithoutNeutralPoints(neutralAtariUpdatedState);
    const territoryRegions = Region.allFor(boardState).filter(r => r.isTerritory());
    const falseEyePoints = utils.flatMap(territoryRegions, r => r.intersections).filter(i => (new EyePoint(boardState, i)).isFalse());

    pointsNeighboringAtari = falseEyePoints.filter(i => {
      return neutralAtariUpdatedState.neighborsFor(i.y, i.x).some(n => neutralAtariUpdatedState.inAtari(n.y, n.x));
    });
  }

  return neutralAtariUpdatedState;
};

const TerritoryScoring = Object.freeze({
  score: function(game) {
    const blackDeadAsCaptures = game.deadStones().filter(function(deadPoint) { return game.intersectionAt(deadPoint.y, deadPoint.x).isBlack(); });
    const whiteDeadAsCaptures = game.deadStones().filter(function(deadPoint) { return game.intersectionAt(deadPoint.y, deadPoint.x).isWhite(); });

    const territory = game.territory();
    const boardState = game.currentState();

    return {
      black: territory.black.length + boardState.whiteStonesCaptured + whiteDeadAsCaptures.length,
      white: territory.white.length + boardState.blackStonesCaptured + blackDeadAsCaptures.length
    };
  },

  territory: function(game) {
    const stateWithoutDeadPoints = boardStateWithoutDeadPoints(game);
    const stateWithoutNeutrals = boardStateWithoutNeutralPoints(stateWithoutDeadPoints);
    const stateWithClearFalseEyesFilled = boardStateWithClearFalseEyesFilled(stateWithoutNeutrals);

    const territoryRegions = Region.allFor(stateWithClearFalseEyesFilled).filter(r => r.isTerritory());

    const territoryRegionsWithoutSeki = territoryRegions.filter(r => {
      const merged = Region.merge(territoryRegions, r);
      const eyeCounts = merged.map(m => Math.ceil(m.numberOfEyes()));

      return eyeCounts.length > 0 && eyeCounts.reduce((a, b) => a + b) >= 2;
    });

    const blackRegions = territoryRegionsWithoutSeki.filter(r => r.isBlack());
    const whiteRegions = territoryRegionsWithoutSeki.filter(r => r.isWhite());

    return {
      black: utils.flatMap(blackRegions, r => r.intersections).map(i => ({ y: i.y, x: i.x })),
      white: utils.flatMap(whiteRegions, r => r.intersections).map(i => ({ y: i.y, x: i.x }))
    };
  }
});

const AreaScoring = Object.freeze({
  score: function(game) {
    const blackStonesOnTheBoard = game.intersections().filter(function(intersection) { return intersection.isBlack() && !game._isDeadAt(intersection.y, intersection.x); });
    const whiteStonesOnTheBoard = game.intersections().filter(function(intersection) { return intersection.isWhite() && !game._isDeadAt(intersection.y, intersection.x); });
    const territory = game.territory();

    return {
      black: territory.black.length + blackStonesOnTheBoard.length,
      white: territory.white.length + whiteStonesOnTheBoard.length
    };
  },

  territory: function(game) {
    const regions = Region.allFor(boardStateWithoutDeadPoints(game));
    const territoryRegions = regions.filter(r => r.isTerritory());
    const blackRegions = territoryRegions.filter(r => r.isBlack());
    const whiteRegions = territoryRegions.filter(r => r.isWhite());

    return {
      black: utils.flatMap(blackRegions, r => r.intersections).map(i => ({ y: i.y, x: i.x })),
      white: utils.flatMap(whiteRegions, r => r.intersections).map(i => ({ y: i.y, x: i.x }))
    };
  }
});

const Scorer = function({ scoreBy, komi } = {}) {
  this._strategy = {
    "area": AreaScoring,
    "territory": TerritoryScoring,
    "equivalence": AreaScoring
  }[scoreBy];

  this._komi = komi;

  if (!this._strategy) {
    throw new Error("Unknown scoring type: " + scoreBy);
  }

  if (this._komi === null || typeof this._komi === "undefined") {
    throw new Error("Error initializing scorer without a komi value");
  }

  if (typeof this._komi !== "number") {
    throw new Error("Komi value given is not a number: " + komi);
  }

  this._usePassStones = scoreBy === "equivalence";

  Object.freeze(this);
};


Scorer.prototype = {
  score: function(game) {
    const result = this._strategy.score(game);
    result.white += this._komi;

    if (this._usePassStones) {
      // Under equivalence scoring, 2 consecutive passes signals(!) the end of the
      // game, but just prior to the end of the game, white must make one final
      // pass move if the game didn't end on a white pass.
      //
      // However, instead of creating a 3rd consecutive pass in the board state,
      // white's additional pass stone is handled by the scoring mechanism alone.
      // The idea is that, under any game resumption, the additional white pass
      // stone must not exist, so we shouldn't add it.
      //
      // NOTE: the final result should rely on this scoring function. Any calculations
      // using raw board state pass stone numbers may be off by 1 in favor of black.
      const needsFinalWhitePassStone = game.currentState().color !== "white";

      return {
        black: result.black + game.currentState().whitePassStones + (needsFinalWhitePassStone ? 1 : 0),
        white: result.white + game.currentState().blackPassStones
      };
    } else {
      return result;
    }
  },

  territory: function(game) {
    return this._strategy.territory(game);
  },

  usingPassStones: function() {
    return this._usePassStones;
  }
};

export default Scorer;
