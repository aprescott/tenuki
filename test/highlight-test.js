var helpers = require("./helpers.js");
var expect = require("chai").expect;
var tenuki = require("../index.js");
var Game = tenuki.Game;
var utils = tenuki.utils;

describe("Board highlights", function() {
  beforeEach(function() {
      helpers.generateNewTestBoard();
    });
  ["svg", "dom"].forEach(renderer => {
  describe(`${renderer} renderer`, function() {
        it("can highlight empty spaces", function() {
          var testBoardElement = document.querySelector("#test-board");

          var game = new Game({ element: testBoardElement, boardSize: 5, renderer: renderer });

          expect(utils.hasClass(testBoardElement.querySelectorAll(".intersection")[1], "highlight")).to.be.false;
          game.highlightAt(1,1);
          expect(utils.hasClass(testBoardElement.querySelectorAll(".intersection")[1], "highlight")).to.be.true;
        });
      });
  });
});