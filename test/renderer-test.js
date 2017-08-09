var helpers = require("./helpers.js");
var expect = require("chai").expect;
var tenuki = require("../index.js");
var Game = tenuki.Game;
var utils = tenuki.utils;

describe("renderer", function() {
  beforeEach(function() {
    helpers.generateNewTestBoard();
  });

  ["svg", "dom"].forEach(renderer => {
    describe(renderer, function() {
      [
        "simple",
        "positional-superko",
        "situational-superko",
        "natural-situational-superko"
      ].forEach(koRule => {
        describe("ko markers", function() {
          it(`displays a ko marker for regular illegal ko moves under ${koRule}`, function() {
            var testBoardElement = document.querySelector("#test-board");

            var game = new Game({ element: testBoardElement, boardSize: 5, renderer: renderer, koRule: koRule });

            // set up a ko marker at (0, 1)
            game.playAt(0, 0); // b
            game.playAt(0, 1); // w
            game.playAt(1, 1); // b
            game.playAt(1, 0); // w
            game.playAt(0, 2); // b
            game.playAt(1, 2); // w

            expect(utils.hasClass(testBoardElement.querySelectorAll(".intersection")[1], "ko")).to.be.false;

            game.playAt(0, 0); // b -- ko starts

            expect(utils.hasClass(testBoardElement.querySelectorAll(".intersection")[1], "ko")).to.be.true;
          });

          it("does not display a ko marker if the ko rule permits recapturing the ko", function() {
            var testBoardElement = document.querySelector("#test-board");

            var game = new Game({ element: testBoardElement, boardSize: 5, renderer: renderer, koRule: "natural-situational-superko" });

            // ┌─●─○─┬─┐
            // ●─○─○─┼─○
            // ●─●─○─○─┤
            // ├─●─●─○─○
            // ●─┴─●─○─┘

            game.playAt(0, 2); // b
            game.playAt(1, 0); // w
            game.playAt(1, 2); // b
            game.playAt(2, 0); // w
            game.playAt(1, 1); // b
            game.playAt(2, 1); // w
            game.playAt(2, 2); // b
            game.playAt(3, 1); // w
            game.playAt(2, 3); // b
            game.playAt(3, 2); // w
            game.playAt(3, 3); // b
            game.playAt(4, 2); // w
            game.playAt(1, 4); // b
            game.playAt(4, 0); // w
            game.playAt(3, 4); // b
            game.playAt(0, 1); // w
            game.playAt(4, 3); // b
            game.pass(); // w (*)
            game.playAt(0, 0); // b -- take "ko"

            // 0, 1 _is_ allowed, so this isn't a ko
            expect(utils.hasClass(testBoardElement.querySelectorAll(".intersection")[1], "ko"), "expected the intersection to not be marked as a ko").to.be.false;
          });
        });
      });

      describe("dead stone marking", function() {
        it("marks two dead stones of opposing color, with nothing else, as dead", function() {
          var testBoardElement = document.querySelector("#test-board");

          var game = new Game({ element: testBoardElement, boardSize: 13, renderer: renderer });

          game.playAt(0, 5); // b
          game.playAt(0, 6); // w
          game.pass();
          game.pass();

          expect(testBoardElement.querySelectorAll(".intersection.dead").length).to.equal(0);

          game.toggleDeadAt(0, 5);
          expect(testBoardElement.querySelectorAll(".intersection.dead").length).to.equal(1);

          game.toggleDeadAt(0, 6);
          expect(testBoardElement.querySelectorAll(".intersection.dead").length).to.equal(2);
        });
      });
    });
  });
});
