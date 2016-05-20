const Intersection = function(y, x, value) {
  this.y = y;
  this.x = x;
  this.value = value || "empty";

  Object.freeze(this);
};

Intersection.prototype = {
  isOccupiedWith: function(color) {
    if (this.isEmpty()) {
      return false;
    }

    return this.value === color;
  },

  isBlack: function() {
    return this.value === "black";
  },

  isWhite: function() {
    return this.value === "white";
  },

  isEmpty: function() {
    return this.value === "empty";
  },

  sameColorAs: function(otherIntersection) {
    return this.value === otherIntersection.value;
  }
};

export default Intersection;
