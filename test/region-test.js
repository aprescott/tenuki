var expect = require("chai").expect;
var tenuki = require("../index.js");
var Game = tenuki.Game;
var Region = require("../lib/region.js").default;
var helpers = require("./helpers");

describe("Region", function() {
  describe("containsSquareFour", function() {
    it("handles checking regions containing intersections at the edge of a board", function() {
      var game = new Game({ boardSize: 5 });

      // ┌─○─●─┬─┐
      // ├─○─●─●─┤
      // ├─┼─○─●─┤
      // ○─○─○─●─●
      // ○─○─●─●─┘

      game.playAt(0, 1);
      game.playAt(0, 2);
      game.playAt(1, 1);
      game.playAt(1, 2);
      game.playAt(2, 2);
      game.playAt(2, 3);
      game.playAt(3, 1);
      game.playAt(3, 3);
      game.playAt(3, 2);
      game.playAt(4, 3);
      game.playAt(3, 0);
      game.playAt(4, 2);
      game.playAt(4, 1);
      game.playAt(1, 3);
      game.playAt(4, 0);
      game.playAt(3, 4);

      [
        [[0, 0], false],
        [[3, 0], true],
        [[4, 4], false],
        [[3, 3], false]
      ].forEach(([[y, x], expectedResult]) => {
        var region = Region.allFor(game.currentState()).find(r => {
          return r.intersections.some(i => i.y == y && i.x == x);
        });

        expect(region.containsSquareFour()).to.equal(expectedResult);
      });
    });
  });

  describe("containsCurvedFour", function() {
    it("handles checking regions containing intersections at the edge of a board", function() {
      var game = new Game({ boardSize: 5 });

      // ┌─○─●─┬─┐
      // ├─○─●─●─┤
      // ├─┼─○─●─┤
      // ○─○─○─●─●
      // ○─○─●─●─┘

      game.playAt(0, 1);
      game.playAt(0, 2);
      game.playAt(1, 1);
      game.playAt(1, 2);
      game.playAt(2, 2);
      game.playAt(2, 3);
      game.playAt(3, 1);
      game.playAt(3, 3);
      game.playAt(3, 2);
      game.playAt(4, 3);
      game.playAt(3, 0);
      game.playAt(4, 2);
      game.playAt(4, 1);
      game.playAt(1, 3);
      game.playAt(4, 0);
      game.playAt(3, 4);

      [
        [[0, 0], true],
        [[3, 0], true],
        [[3, 3], true],
        [[4, 4], false]
      ].forEach(([[y, x], expectedResult]) => {
        var region = Region.allFor(game.currentState()).find(r => {
          return r.intersections.some(i => i.y == y && i.x == x);
        });

        expect(region.containsCurvedFour()).to.equal(expectedResult);
      });
    });
  });
});
