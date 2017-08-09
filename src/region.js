import utils from "./utils";

const Region = function(boardState, intersections) {
  this.boardState = boardState;
  this.intersections = intersections;

  this._computed = {};

  Object.freeze(this);
};

Region._startingAt = function(boardState, y, x) {
  const startingPoint = boardState.intersectionAt(y, x);

  const [includedPoints, boundaryPoints] = boardState.partitionTraverse(startingPoint, neighbor => {
    return neighbor.sameColorAs(startingPoint);
  });

  return [includedPoints, boundaryPoints];
};

Region.allFor = function(boardState) {
  let checkedPoints = [];
  const regions = [];

  boardState.intersections.forEach(point => {
    if (checkedPoints.indexOf(point) > -1) {
      // do nothing
    } else {
      const [regionPoints, _] = boardState.partitionTraverse(point, neighbor => {
        return neighbor.sameColorAs(point);
      });

      regions.push(new Region(boardState, regionPoints));
      checkedPoints = checkedPoints.concat(regionPoints);
    }
  });

  return regions;
};

Region.merge = function(regions, region) {
  let mergedRegions = [region];
  let length = -1;

  while (mergedRegions.length !== length) {
    length = mergedRegions.length;

    mergedRegions = regions.filter(r => {
      return r.isEmpty() && r.isTerritory() && r.territoryColor() === region.territoryColor() && r.expandedBoundaryStones().some(stone => {
        return mergedRegions.some(latestRegion => {
          return latestRegion.expandedBoundaryStones().indexOf(stone) > -1;
        });
      });
    });
  }

  return mergedRegions;
};

Region.prototype = {
  isEmpty: function() {
    return this.intersections[0].isEmpty();
  },

  isTerritory: function() {
    const point = this.intersections[0];

    if (!point.isEmpty()) {
      return false;
    }

    const [_, boundaryPoints] = Region._startingAt(this.boardState, point.y, point.x);
    const surroundingColors = utils.unique(boundaryPoints.map(i => i.value));
    const isTerritory = surroundingColors.length === 1 && surroundingColors[0] !== "empty";

    return isTerritory;
  },

  territoryColor: function() {
    const point = this.intersections[0];
    const [_, boundaryPoints] = Region._startingAt(this.boardState, point.y, point.x);
    const surroundingColors = utils.unique(boundaryPoints.map(i => i.value));
    const isTerritory = surroundingColors.length === 1 && surroundingColors[0] !== "empty";

    if (!point.isEmpty() || !isTerritory) {
      throw new Error("Attempted to obtain territory color for something that isn't territory, region containing " + point.y + "," + point.x);
    } else {
      return surroundingColors[0];
    }
  },

  isBlack: function() {
    return this.territoryColor() === "black";
  },

  isWhite: function() {
    return this.territoryColor() === "white";
  },

  isNeutral: function() {
    return !this.intersections[0].isBlack() && !this.intersections[0].isWhite() && !this.isTerritory();
  },

  exterior: function() {
    return this.boardState.intersections.filter(i => {
      return this.intersections.indexOf(i) < 0 && this.boardState.neighborsFor(i.y, i.x).some(neighbor => {
        return this.intersections.indexOf(neighbor) > -1;
      });
    });
  },

  boundaryStones: function() {
    if (this._computed.boundaryStones) {
      return this._computed.boundaryStones;
    }

    if (!this.isEmpty()) {
      throw new Error("Attempted to obtain boundary stones for non-empty region");
    }

    this._computed.boundaryStones = this.exterior().filter(i => !i.sameColorAs(this.intersections[0]));

    return this._computed.boundaryStones;
  },

  expandedBoundaryStones: function() {
    if (this._computed.expandedBoundaryStones) {
      return this._computed.expandedBoundaryStones;
    }

    const boundaryStones = this.boundaryStones();
    const regions = Region.allFor(this.boardState).filter(r => r.intersections.some(i => boundaryStones.indexOf(i) > -1));

    this._computed.expandedBoundaryStones = utils.flatMap(regions, r => r.intersections);

    return this._computed.expandedBoundaryStones;
  },

  lengthOfTerritoryBoundary: function() {
    // count the empty border points to treat the edge of the board itself as points
    const borderPoints = this.intersections.filter(i => {
      return i.y === 0 || i.y === this.boardState.boardSize - 1 || i.x === 0 || i.x === this.boardState.boardSize - 1;
    });
    const cornerPoints = this.intersections.filter(i => {
      return i.y % this.boardState.boardSize - 1 === 0 && i.x % this.boardState.boardSize - 1 === 0;
    });

    return this.boundaryStones().length + borderPoints.length + cornerPoints.length;
  },

  containsSquareFour: function() {
    return this.intersections.some(i => {
      return [
        [0, 0], [0, 1],
        [1, 0], [1, 1]
      ].every(([yOffset, xOffset]) => {
        const y = i.y + yOffset;
        const x = i.x + xOffset;

        const onTheBoard = y >= 0 && y < this.boardState.boardSize && x >= 0 && x < this.boardState.boardSize;

        return onTheBoard && this.boardState.intersectionAt(y, x).sameColorAs(i);
      });
    });
  },

  containsCurvedFour: function() {
    return this.intersections.some(i => {
      return [
        [
          [0, 0],
          [1, 0],
          [2, 0], [2, 1]
        ],
        [
                         [-1, 2],
          [0, 0], [0, 1], [0, 2]
        ],
        [
          [0, 0], [0, 1],
                  [1, 1],
                  [2, 1]
        ],
        [
          [-1, 0], [-1, 1], [-1, 2],
          [0, 0]
        ],
        [
                 [-2, 1],
                 [-1, 1],
          [0, 0], [0, 1]
        ],
        [
          [0, 0],
          [1, 0], [1, 1], [1, 2]
        ],
        [
          [0, -1], [0, 0],
          [1, -1],
          [2, -1]
        ],
        [
          [-1, -2], [-1, -1], [-1, 0],
                              [0, 0]
        ]
      ].some(expectedPoints => {
        return expectedPoints.every(([yOffset, xOffset]) => {
          const y = i.y + yOffset;
          const x = i.x + xOffset;

          const onTheBoard = y >= 0 && y < this.boardState.boardSize && x >= 0 && x < this.boardState.boardSize;

          return onTheBoard && this.boardState.intersectionAt(y, x).sameColorAs(i);
        });
      });
    });
  },

  numberOfEyes: function() {
    if (!this.intersections[0].isEmpty()) {
      throw new Error("Unexpected calculation of number of eyes for a non-empty region containing " + this.intersections[0].y + "," + this.intersections[0].x);
    }

    const boundaryLength = this.lengthOfTerritoryBoundary();

    if (boundaryLength < 2) {
      throw new Error("Unexpected boundary length of " + boundaryLength + " for region including " + this.intersections[0].y + "," + this.intersections[0].x);
    }

    if (boundaryLength >= 10) {
      return 2;
    }

    let eyes;

    switch (boundaryLength) {
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
        eyes = 1;
        break;
      case 7:
        eyes = 1.5;
        break;
      case 8:
        if (this.containsSquareFour()) {
          eyes = 1;
        } else if (this.containsCurvedFour()) {
          eyes = 2;
        } else {
          eyes = 1.5;
        }

        break;
      case 9:
        if (this.containsSquareFour()) {
          eyes = 1.5;
        } else {
          eyes = 2;
        }
        break;

      default:
        throw new Error("unhandled boundary length " + boundaryLength);
    }

    return eyes;
  }
};

export default Region;
