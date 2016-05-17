const EyePoint = function(boardState, intersection) {
  this.boardState = boardState;
  this.intersection = intersection;

  Object.freeze(this);
};

EyePoint.prototype = {
  diagonals: function() {
    const diagonals = [];

    let possibleX = [];
    let possibleY = [];

    if (this.intersection.x > 0) {
      possibleX.push(this.intersection.x - 1);
    }

    if (this.intersection.x < (this.boardState.boardSize - 1)) {
      possibleX.push(this.intersection.x + 1);
    }

    if (this.intersection.y > 0) {
      possibleY.push(this.intersection.y - 1);
    }

    if (this.intersection.y < (this.boardState.boardSize - 1)) {
      possibleY.push(this.intersection.y + 1);
    }

    possibleX.forEach(x => {
      possibleY.forEach(y => {
        diagonals.push(this.boardState.intersectionAt(y, x));
      });
    });

    return diagonals;
  },

  isFalse: function() {
    if (!this.intersection.isEmpty()) {
      return false;
    }

    const diagonals = this.diagonals();
    const onFirstLine = diagonals.length <= 2;

    const neighbors = this.neighbors();
    const occupiedNeighbors = neighbors.filter(i => !i.isEmpty());

    if (onFirstLine && occupiedNeighbors.length < 1) {
      return false;
    }

    if (!onFirstLine && occupiedNeighbors.length < 2) {
      return false;
    }

    const opposingOccupiedDiagonals = diagonals.filter(d => !d.isEmpty() && !d.sameColorAs(occupiedNeighbors[0]));

    if (onFirstLine) {
      return opposingOccupiedDiagonals.length >= 1;
    } else {
      return opposingOccupiedDiagonals.length >= 2;
    }
  },

  neighbors: function() {
    return this.boardState.neighborsFor(this.intersection.y, this.intersection.x);
  },

  filledColor: function() {
    if (!this.isFalse()) {
      throw new Error("Attempting to find filled color for a non-false eye");
    }

    return this.neighbors()[0].value;
  }
};

export default EyePoint;
