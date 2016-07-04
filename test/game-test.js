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

    it("does not allow unknown scoring types", function() {
      var game = new Game();
      expect(function() { game.setup({ boardSize: 19, scoring: "area" }); }).to.not.throw(Error);
      expect(function() { game.setup({ boardSize: 19, scoring: "territory" }); }).to.not.throw(Error);
      expect(function() { game.setup({ boardSize: 19, scoring: "equivalence" }); }).to.not.throw(Error);

      expect(function() { game.setup({ boardSize: 19, scoring: "Area" }); }).to.throw(Error,  "Unknown scoring type: Area");
      expect(function() { game.setup({ boardSize: 19, scoring: "terRitory" }); }).to.throw(Error,  "Unknown scoring type: terRitory");
      expect(function() { game.setup({ boardSize: 19, scoring: "gibberish" }); }).to.throw(Error,  "Unknown scoring type: gibberish");
    });

    it("does not allow unknown ko rules", function() {
      var game = new Game();

      expect(function() { game.setup({ boardSize: 19, koRule: "simple" }); }).to.not.throw(Error);

      expect(function() { game.setup({ boardSize: 19, koRule: "Simple" }); }).to.throw(Error, "Unknown ko rule: Simple");
      expect(function() { game.setup({ boardSize: 19, koRule: "SIMPLE" }); }).to.throw(Error, "Unknown ko rule: SIMPLE");
      expect(function() { game.setup({ boardSize: 19, koRule: "positional" }); }).to.throw(Error, "Unknown ko rule: positional");
      expect(function() { game.setup({ boardSize: 19, koRule: "gibberish" }); }).to.throw(Error, "Unknown ko rule: gibberish");
    });
  });

  describe("handicap stones", function() {
    it("defaults to no handicap stones", function() {
      var game = new Game();
      game.setup();

      expect(game.handicapStones).to.equal(0);
      var nonEmptyPoints = game.currentState().intersections.filter(i => !i.isEmpty());
      expect(nonEmptyPoints.length).to.equal(0);
    });

    it("allows 2-9 handicap stones", function() {
      [2, 3, 4, 5, 6, 7, 8, 9].forEach(function(h) {
        var game = new Game();
        game.setup({ handicapStones: h });

        expect(game.handicapStones).to.equal(h);
        var nonEmptyPoints = game.currentState().intersections.filter(i => !i.isEmpty());
        expect(nonEmptyPoints.length).to.equal(h);
        expect(game.currentPlayer()).to.equal("white");
      });

      var game = new Game();
      game.setup({ handicapStones: 2 });
      expect(game.handicapStones).to.equal(2);
      var nonEmptyPoints = game.currentState().intersections.filter(i => !i.isEmpty());
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

    it("treats handicap stone positions as illegal moves", function() {
      var game = new Game();
      game.setup({ handicapStones: 9 });

      expect(game.isIllegalAt(3, 3)).to.be.true;
    });
  });

  describe("free handicap placement", function() {
    it("is off by default", function() {
      var game = new Game();
      game.setup({ handicapStones: 2 });

      game.playAt(18, 18);

      var nonEmptyPoints = game.currentState().intersections.filter(i => !i.isEmpty());
      expect(nonEmptyPoints.length).to.equal(3);

      expect(nonEmptyPoints[0].value).to.equal("black");
      expect(nonEmptyPoints[0].y).to.equal(3);
      expect(nonEmptyPoints[0].x).to.equal(15);

      expect(nonEmptyPoints[1].value).to.equal("black");
      expect(nonEmptyPoints[1].y).to.equal(15);
      expect(nonEmptyPoints[1].x).to.equal(3);

      expect(nonEmptyPoints[2].value).to.equal("white");
      expect(nonEmptyPoints[2].y).to.equal(18);
      expect(nonEmptyPoints[2].x).to.equal(18);
    });

    it("allows black to place stones for the first n moves", function() {
      var game = new Game();
      game.setup({ handicapStones: 2, freeHandicapPlacement: true });

      var nonEmptyPoints = game.currentState().intersections.filter(i => !i.isEmpty());
      expect(nonEmptyPoints.length).to.equal(0);

      expect(game.currentPlayer()).to.equal("black");
      game.playAt(5, 5);
      expect(game.currentPlayer()).to.equal("black");
      game.playAt(6, 6);
      expect(game.currentPlayer()).to.equal("white");
      game.playAt(7, 7);

      nonEmptyPoints = game.currentState().intersections.filter(i => !i.isEmpty());
      expect(nonEmptyPoints.length).to.equal(3);

      expect(nonEmptyPoints[0].value).to.equal("black");
      expect(nonEmptyPoints[0].y).to.equal(5);
      expect(nonEmptyPoints[0].x).to.equal(5);

      expect(nonEmptyPoints[1].value).to.equal("black");
      expect(nonEmptyPoints[1].y).to.equal(6);
      expect(nonEmptyPoints[1].x).to.equal(6);

      expect(nonEmptyPoints[2].value).to.equal("white");
      expect(nonEmptyPoints[2].y).to.equal(7);
      expect(nonEmptyPoints[2].x).to.equal(7);
    });

    it("is undoable", function() {
      var game = new Game();
      game.setup({ handicapStones: 2, freeHandicapPlacement: true });

      expect(game.currentPlayer()).to.equal("black");
      game.playAt(5, 5);
      expect(game.currentPlayer()).to.equal("black");
      game.playAt(6, 6);
      expect(game.currentPlayer()).to.equal("white");
      game.undo();
      expect(game.currentPlayer()).to.equal("black");
      game.undo();
      expect(game.currentPlayer()).to.equal("black");

      var nonEmptyPoints = game.currentState().intersections.filter(i => !i.isEmpty());
      expect(nonEmptyPoints.length).to.equal(0);

      game.playAt(5, 5);
      expect(game.currentPlayer()).to.equal("black");
      game.playAt(6, 6);
      expect(game.currentPlayer()).to.equal("white");

      nonEmptyPoints = game.currentState().intersections.filter(i => !i.isEmpty());
      expect(nonEmptyPoints.length).to.equal(2);

      expect(nonEmptyPoints[0].value).to.equal("black");
      expect(nonEmptyPoints[0].y).to.equal(5);
      expect(nonEmptyPoints[0].x).to.equal(5);

      expect(nonEmptyPoints[1].value).to.equal("black");
      expect(nonEmptyPoints[1].y).to.equal(6);
      expect(nonEmptyPoints[1].x).to.equal(6);
    });
  });

  describe("komi", function() {
    var game = new Game();
    game.setup();

    game.pass();
    game.pass();

    expect(game.isOver()).to.be.true;

    expect(game.score().black).to.equal(0);
    expect(game.score().white).to.equal(0);

    [0.5, 7, 7.5, 100].forEach(function(komiValue) {
      var game = new Game();
      game.setup({ komi: komiValue });

      game.pass();
      game.pass();

      expect(game.score().black).to.equal(0);
      expect(game.score().white).to.equal(komiValue);
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

      expect(game.currentState().playedPoint.y).to.equal(2);
      game.currentState().playedPoint.y = 10;
      expect(game.currentState().playedPoint.y).to.equal(2);
    });
  });
});
