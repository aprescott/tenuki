var helpers = require("./helpers.js");
var expect = require("chai").expect;
var tenuki = require("../index.js");
var Game = tenuki.Game;
var utils = tenuki.utils;

describe("SVG renderer", function() {
  beforeEach(function() {
    helpers.generateNewTestBoard();
  });

  describe("click handling", function() {
    it("updates board state", function() {
      var testBoardElement = document.querySelector("#test-board");

      var game = new Game({ element: testBoardElement, boardSize: 5 });

      expect(testBoardElement.querySelectorAll(".intersection.empty").length).to.equal(25);

      testBoardElement.querySelectorAll(".intersection")[0*5 + 3].click();

      expect(game.intersectionAt(0, 3).isBlack()).to.be.true;
      expect(game.isWhitePlaying()).to.be.true;

      expect(testBoardElement.querySelectorAll(".intersection.empty").length).to.equal(24);
    });
  });

  describe("board state rendering", function() {
    it("starts with an empty board", function() {
      var testBoardElement = document.querySelector("#test-board");

      var game = new Game({ element: testBoardElement, boardSize: 5 });

      expect(testBoardElement.querySelectorAll(".intersection").length).to.equal(25);
      expect(testBoardElement.querySelectorAll(".intersection.empty").length).to.equal(25);
    });

    it("is bound to moves on the game", function() {
      var testBoardElement = document.querySelector("#test-board");

      var game = new Game({ element: testBoardElement, boardSize: 5 });

      game.playAt(3, 2);
      expect(testBoardElement.querySelectorAll(".intersection").length).to.equal(25);
      expect(testBoardElement.querySelectorAll(".intersection.black").length).to.equal(1);
      expect(testBoardElement.querySelectorAll(".intersection.white").length).to.equal(0);
      expect(utils.hasClass(testBoardElement.querySelectorAll(".intersection")[3*5 + 2], "played")).to.be.true;
      expect(utils.hasClass(testBoardElement.querySelectorAll(".intersection")[3*5 + 2], "black")).to.be.true;

      game.playAt(2, 4);
      expect(testBoardElement.querySelectorAll(".intersection").length).to.equal(25);
      expect(testBoardElement.querySelectorAll(".intersection.black").length).to.equal(1);
      expect(testBoardElement.querySelectorAll(".intersection.white").length).to.equal(1);
      expect(utils.hasClass(testBoardElement.querySelectorAll(".intersection")[3*5 + 2], "played")).to.be.false;
      expect(utils.hasClass(testBoardElement.querySelectorAll(".intersection")[3*5 + 2], "black")).to.be.true;
    });

    it("undoes state correctly", function() {
      var testBoardElement = document.querySelector("#test-board");

      var game = new Game({ element: testBoardElement, boardSize: 5 });

      game.playAt(3, 2);
      game.undo();

      expect(testBoardElement.querySelectorAll(".intersection").length).to.equal(25);
      expect(testBoardElement.querySelectorAll(".intersection.empty").length).to.equal(25);
    });

    it("removes captured stones", function() {
      var testBoardElement = document.querySelector("#test-board");

      var game = new Game({ element: testBoardElement, boardSize: 5 });

      game.playAt(0, 0);
      game.playAt(0, 1);
      game.playAt(3, 3);

      expect(utils.hasClass(testBoardElement.querySelectorAll(".intersection")[0], "black")).to.be.true;

      game.playAt(1, 0);

      expect(utils.hasClass(testBoardElement.querySelectorAll(".intersection")[0], "black")).to.be.false;
    });
  });

  describe("number of lines", function() {
    [3, 5, 7, 9, 11, 13, 15, 17, 19].forEach(b => {
      it(`is correct for ${b}x${b}`, function() {
        var testBoardElement = document.querySelector("#test-board");

        var game = new Game({ element: testBoardElement, boardSize: b });

        expect(testBoardElement.querySelectorAll(".lines").length).to.equal(1);
        expect(testBoardElement.querySelectorAll(".line-box").length).to.equal((b - 1) * (b - 1));
      });
    });
  })

  describe("number of hoshi points", function() {
    var cases = {
      3: 1,
      4: 0,
      5: 1,
      6: 0,
      7: 4,
      8: 4,
      9: 9,
      10: 4,
      11: 9,
      12: 4,
      13: 9,
      14: 4,
      15: 9,
      16: 4,
      17: 9,
      18: 4,
      19: 9
    };

    Object.keys(cases).forEach(k => {
      var expectedNumber = cases[k];
      var b = Number(k);

      it(`is the correct number for ${b}x${b}`, function() {
        var testBoardElement = document.querySelector("#test-board");

        var game = new Game({ element: testBoardElement, boardSize: b });

        expect(testBoardElement.querySelectorAll("circle.hoshi").length).to.equal(expectedNumber);
      });
    });
  })
});
