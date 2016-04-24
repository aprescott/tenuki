var expect = require("chai").expect;
var tenuki = require("../index.js");
var Game = tenuki.Game;

describe("Game", function() {
  describe("setup", function() {
    it("defaults to a board size of 19", function() {
      var game = new Game();
      expect(game.boardSize).to.be.null;
      game.setup();
      expect(game.boardSize).to.equal(19);
    });

    it("defaults to no handicap stones", function() {
      var game = new Game();
      game.setup();

      expect(game.handicapStones).to.equal(0);
      var nonEmptyPoints = game.currentMove().points.filter(i => !i.isEmpty());
      expect(nonEmptyPoints.length).to.equal(0);
    });

    it("allows 2-9 handicap stones", function() {
      [2, 3, 4, 5, 6, 7, 8, 9].forEach(function(h) {
        var game = new Game();
        game.setup({ handicapStones: h });

        expect(game.handicapStones).to.equal(h);
        var nonEmptyPoints = game.currentMove().points.filter(i => !i.isEmpty());
        expect(nonEmptyPoints.length).to.equal(h);
        expect(game.currentPlayer()).to.equal("white");
      });

      var game = new Game();
      game.setup({ handicapStones: 2 });
      expect(game.handicapStones).to.equal(2);
      var nonEmptyPoints = game.currentMove().points.filter(i => !i.isEmpty());
      expect(nonEmptyPoints.length).to.equal(2);
      expect(nonEmptyPoints[0].value).to.equal("black");
      expect(nonEmptyPoints[0].y).to.equal(3);
      expect(nonEmptyPoints[0].x).to.equal(15);
      expect(nonEmptyPoints[1].y).to.equal(15);
      expect(nonEmptyPoints[1].x).to.equal(3);
    });

    it("does not allow invalid handicap stone values", function() {
      var game = new Game();
      expect(function() { game.setup({ handicapStones: -1 }); }).to.throw(Error, "Only 2 to 9 handicap stones are supported");
      expect(function() { game.setup({ handicapStones: 1 }); }).to.throw(Error, "Only 2 to 9 handicap stones are supported");
      expect(function() { game.setup({ handicapStones: 10 }); }).to.throw(Error, "Only 2 to 9 handicap stones are supported");
    });

    it("does not allow handicap stones on non-standard sizes", function() {
      var game = new Game();
      expect(function() { game.setup({ boardSize: 19, handicapStones: 2 }); }).to.not.throw(Error);
      expect(function() { game.setup({ boardSize: 17, handicapStones: 2 }); }).to.throw(Error, "Handicap stones not supported on sizes other than 9x9, 13x13 and 19x19");
    });
  });

  describe("coordinatesFor", function() {
    it("is the A19-T1 coordinate value for a point", function() {
      var game = new Game();
      game.setup();
      expect(game.coordinatesFor(5, 3)).to.equal("D14");
      expect(game.coordinatesFor(0, 0)).to.equal("A19");
      expect(game.coordinatesFor(18, 18)).to.equal("T1");
    });

    it("skips over I", function() {
      var game = new Game();
      game.setup();
      expect(game.coordinatesFor(9, 7)).to.equal("H10");
      expect(game.coordinatesFor(9, 8)).to.equal("J10");
      expect(game.coordinatesFor(9, 9)).to.equal("K10");
    });
  });

  describe("move state", function() {
    it("is immutable", function() {
      var game = new Game();
      game.setup();
      game.playAt(2, 3);

      expect(game.currentMove().y).to.equal(2);
      game.currentMove().y = 10;
      expect(game.currentMove().y).to.equal(2);
    });
  });
});
