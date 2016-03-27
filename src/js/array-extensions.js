if (!Array.prototype.flatMap) {
  Array.prototype.flatMap = function(lambda) {
    return Array.prototype.concat.apply([], this.map(lambda));
  };
}

if (!Array.prototype.flatten) {
  Array.prototype.flatten = function() {
    return this.reduce(function(a, b) { return a.concat(b); })
  }
}

if (!Array.prototype.sample) {
  Array.prototype.sample = function() {
    return this[Math.floor(Math.random() * this.length)];
  }
}
