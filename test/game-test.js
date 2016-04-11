var expect = require("chai").expect;
var tenuki = require("../index.js");
var Game = tenuki.Game;

describe("Game", function() {
  describe("coordinatesFor", function() {
    it("is the A19-T1 coordinate value for a point", function() {
      var game = new Game();
      expect(game.coordinatesFor(5, 3)).to.equal("D14");
      expect(game.coordinatesFor(0, 0)).to.equal("A19");
      expect(game.coordinatesFor(18, 18)).to.equal("T1");
    });

    it("skips over I", function() {
      var game = new Game();
      expect(game.coordinatesFor(9, 7)).to.equal("H10");
      expect(game.coordinatesFor(9, 8)).to.equal("J10");
      expect(game.coordinatesFor(9, 9)).to.equal("K10");
    });
  });
});
