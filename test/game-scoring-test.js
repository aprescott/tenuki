var expect = require("chai").expect;
var tenuki = require("../index.js");
var Game = tenuki.Game;

var run = function(scoring) {
  var game = new Game({ scoring: scoring });

  // divide the board down the middle, black on the right
  game.playAt(0, 9); // b
  game.playAt(0, 8); // w
  game.playAt(1, 9); // b
  game.playAt(1, 8); // w
  game.playAt(2, 9); // b
  game.playAt(2, 8); // w
  game.playAt(3, 9); // b
  game.playAt(3, 8); // w
  game.playAt(4, 9); // b
  game.playAt(4, 8); // w
  game.playAt(5, 9); // b
  game.playAt(5, 8); // w
  game.playAt(6, 9); // b
  game.playAt(6, 8); // w
  game.playAt(7, 9); // b
  game.playAt(7, 8); // w
  game.playAt(8, 9); // b
  game.playAt(8, 8); // w
  game.playAt(9, 9); // b
  game.playAt(9, 8); // w
  game.playAt(10, 9); // b
  game.playAt(10, 8); // w
  game.playAt(11, 9); // b
  game.playAt(11, 8); // w
  game.playAt(12, 9); // b
  game.playAt(12, 8); // w
  game.playAt(13, 9); // b
  game.playAt(13, 8); // w
  game.playAt(14, 9); // b
  game.playAt(14, 8); // w
  game.playAt(15, 9); // b
  game.playAt(15, 8); // w
  game.playAt(16, 9); // b
  game.playAt(16, 8); // w
  game.playAt(17, 9); // b
  game.playAt(17, 8); // w
  game.playAt(18, 9); // b
  game.playAt(18, 8); // w
  game.pass(); // b
  game.pass(); // w

  expect(game.isOver()).to.be.true;

  return game;
};

var setupCaptures = function(game) {
  expect(game.currentState().blackStonesCaptured).to.equal(0);
  expect(game.currentState().whiteStonesCaptured).to.equal(0);

  // play in the corner so white captures a stone and leaves 2 black stones dead
  game.playAt(0, 0); // b
  game.playAt(0, 1); // w
  game.playAt(1, 1); // b

  expect(game.currentState().blackStonesCaptured).to.equal(0);
  expect(game.currentState().whiteStonesCaptured).to.equal(0);

  game.playAt(1, 0); // w

  expect(game.currentState().blackStonesCaptured).to.equal(1);
  expect(game.currentState().whiteStonesCaptured).to.equal(0);

  game.playAt(0, 2); // b

  game.pass(); // w
  game.pass(); // b
};

describe("scoring rules", function() {
  describe("area scoring", function() {
    it("counts area as territory plus stones played, plus captures, with eyes in seki counted", function() {
      var game = run("area");

      expect(game.score().black).to.equal((9 + 1)*19);
      expect(game.score().white).to.equal(9*19);

      game.undo();
      game.undo();

      setupCaptures(game);

      expect(game.isOver()).to.be.true;

      // territory + stones on the board
      expect(game.score().black).to.equal(10*19 + 2);
      // 1 point of territory + 2 stones played inside
      expect(game.score().white).to.equal(1 + 1*19 + 2);

      // mark dead stones
      game.toggleDeadAt(1, 1);

      // 2 dead stones are now ignored because they're marked dead
      expect(game.score().black).to.equal(10*19);
      // rectangle territory, 8*19
      // plus 1*19 for the stones on the board
      // 2 white stones played inside the territory, IGNORED
      // 1 captured black stone, IGNORED
      // 2 dead stones, IGNORED
      expect(game.score().white).to.equal(9*19);
    });
  });

  describe("equivalence scoring", function() {
    it("counts as area, plus pass stones per player", function() {
      var game = run("equivalence");

      expect(game.score().black).to.equal((9 + 1)*19 + 1);
      expect(game.score().white).to.equal(9*19 + 1);

      game.undo();
      game.undo();

      setupCaptures(game);

      expect(game.isOver()).to.be.true;

      // territory + stones on the board + 2 pass stones
      expect(game.score().black).to.equal(10*19 + 2 + 2);
      // 1 point of territory + 2 stones played inside + 1 pass stone
      expect(game.score().white).to.equal(1 + 1*19 + 2 + 1);

      // mark dead stones
      game.toggleDeadAt(1, 1);

      // 2 dead stones are now ignored because they're marked dead
      // plus 2 pass stones
      expect(game.score().black).to.equal(10*19 + 2);
      // rectangle territory, 8*19
      // plus 1*19 for the stones on the board
      // 2 white stones played inside the territory, IGNORED
      // 1 captured black stone, IGNORED
      // 2 dead stones, IGNORED
      // 1 pass stone
      expect(game.score().white).to.equal(9*19 + 1);
    });

    it("adds one final pass stone by white if necessary", function() {
      var game = new Game({ scoring: "equivalence" });

      game.pass(); // b
      game.pass(); // w

      expect(game.isOver()).to.be.true;
      expect(game.score().black).to.equal(1);
      expect(game.score().white).to.equal(1);

      game = new Game({ scoring: "equivalence" });

      game.playAt(1, 1); // b
      game.pass(); // w
      game.pass(); // b

      expect(game.isOver()).to.be.true;
      // area + extra pass stone
      expect(game.score().black).to.equal(19*19 + 1 + 1);
      expect(game.score().white).to.equal(1);
    });
  });

  describe("territory scoring", function() {
    it("counts only territory, excluding stones played, plus captures", function() {
      var game = run("territory");

      expect(game.score().black).to.equal(9*19);
      expect(game.score().white).to.equal(8*19);

      game.undo();
      game.undo();

      setupCaptures(game);

      expect(game.isOver()).to.be.true;

      // territory + captured stones, but with ambiguous territory remaining
      expect(game.score().black).to.equal(9*19);
      // 1 captured stone
      // note the top-left corner is ignored as part of neutral point filling
      // for seki calculations
      expect(game.score().white).to.equal(1);

      // mark dead stones
      game.toggleDeadAt(1, 1);

      expect(game.score().black).to.equal(9*19);
      // rectangle territory, 8*19
      // 2 white stones played inside the territory, -2
      // 1 captured black stone, +1,
      // 2 dead stones, +2
      expect(game.score().white).to.equal(8*19 - 2 + 1 + 2);
    });
  });

  describe("toggling multi-stone groups as dead", function() {
    it("treats the whole group as dead when a single stone is marked", function() {
      var game = new Game();

      game.playAt(0, 9); // b
      game.playAt(0, 8); // w
      game.playAt(1, 9); // b
      game.pass();
      game.pass();

      // mark the 2-stone black group as dead
      expect(game.deadStones().length).to.equal(0);

      game.toggleDeadAt(0, 9);

      expect(game.deadStones().length).to.equal(2);
      expect(game.deadStones()[0].y).to.equal(0);
      expect(game.deadStones()[0].x).to.equal(9);
      expect(game.deadStones()[1].y).to.equal(1);
      expect(game.deadStones()[1].x).to.equal(9);

      expect(game.score().black).to.equal(0);
      expect(game.score().white).to.equal(19*19 - 1 + 2);

      // unmark it dead
      game.toggleDeadAt(0, 9);

      expect(game.deadStones().length).to.equal(0);
      expect(game.score().black).to.equal(0);
      expect(game.score().white).to.equal(0);
    });
  });

  describe("territory marking with whole-board edge cases", function() {
    it("scores two live stones of opposing color, with nothing else, as no points", function() {
      var game = new Game();

      game.playAt(0, 9); // b
      game.playAt(0, 10); // w
      game.pass();
      game.pass();

      expect(game.score().black).to.equal(0);
      expect(game.score().white).to.equal(0);
    });

    it("scores two dead stones of opposing color, with nothing else, as 1 point each under territory scoring", function() {
      var game = new Game();

      game.playAt(0, 9); // b
      game.playAt(0, 10); // w
      game.pass();
      game.pass();

      game.toggleDeadAt(0, 9);
      game.toggleDeadAt(0, 10);

      expect(game.score().black).to.equal(1);
      expect(game.score().white).to.equal(1);
    });
  });
});
