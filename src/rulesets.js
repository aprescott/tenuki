import utils from "./utils";
import Intersection from "./intersection";
import Region from "./region";
import EyePoint from "./eye-point";

const boardStateWithoutDeadPoints = function(game) {
  return game.boardState()._withoutIntersectionsMatching(i => {
    return game.isDeadAt(i.y, i.x);
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

const TerritoryRules = Object.freeze({
  isIllegal: function(y, x, boardState) {
    const intersection = boardState.intersectionAt(y, x);
    const isEmpty = intersection.isEmpty();
    const isSuicide = boardState.wouldBeSuicide(y, x);
    const koPoint = boardState.koPoint;
    const isKoViolation = koPoint && koPoint.y === y && koPoint.x === x;

    return !isEmpty || isKoViolation || isSuicide;
  },

  score: function(game) {
    const blackDeadAsCaptures = game._deadPoints.filter(function(deadPoint) { return game.intersectionAt(deadPoint.y, deadPoint.x).isBlack(); });
    const whiteDeadAsCaptures = game._deadPoints.filter(function(deadPoint) { return game.intersectionAt(deadPoint.y, deadPoint.x).isWhite(); });

    const territory = game.territory();
    const boardState = game.boardState();

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

const AreaRules = Object.freeze({
  isIllegal: TerritoryRules.isIllegal,

  score: function(game) {
    const blackStonesOnTheBoard = game.intersections().filter(function(intersection) { return intersection.isBlack() && !game.isDeadAt(intersection.y, intersection.x); });
    const whiteStonesOnTheBoard = game.intersections().filter(function(intersection) { return intersection.isWhite() && !game.isDeadAt(intersection.y, intersection.x); });
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

export { TerritoryRules, AreaRules };
