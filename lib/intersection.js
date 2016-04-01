var Intersection = function(y, x, board) {
  this.y = y;
  this.x = x;
  this.value = "empty";
  this.board = board;

  this.duplicate = function() {
    var duplicateIntersection = new Intersection(this.y, this.x, this.board);
    duplicateIntersection.value = this.value;

    return duplicateIntersection;
  }

  this.setWhite = function() {
    this.value = "white";
  };

  this.isOccupiedWith = function(color) {
    if (this.isEmpty()) {
      return false;
    }

    return this.value === color;
  };

  this.setBlack = function() {
    this.value = "black";
  };

  this.isBlack = function() {
    return this.value === "black";
  };

  this.isWhite = function() {
    return this.value === "white";
  }

  this.setEmpty = function() {
    this.value = "empty";
  };

  this.isEmpty = function() {
    return this.value === "empty";
  };

  this.sameColorAs = function(otherIntersection) {
    return this.value === otherIntersection.value;
  };
};

module.exports = Intersection;
