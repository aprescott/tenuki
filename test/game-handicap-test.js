var expect = require("chai").expect;
var tenuki = require("../index.js");
var Game = tenuki.Game;

describe("handicap stones", function() {
  describe("default placement on 19x19", function() {
    it("is at the correct hoshi points", function() {
      var game = new Game();

      expect(game.isBlackPlaying()).to.be.true;

      var o = {
        2: [
          [3, 15],
          [15, 3]
        ],
        3: [
          [3, 15],
          [15, 3],
          [15, 15]
        ],
        4: [
          [3, 3],
          [3, 15],
          [15, 3],
          [15, 15]
        ],
        5: [
          [3, 3],
          [3, 15],
          [9, 9],
          [15, 3],
          [15, 15]
        ],
        6: [
          [3, 3],
          [9, 3],
          [15, 3],
          [3, 15],
          [9, 15],
          [15, 15]
        ],
        7: [
          [3, 3],
          [3, 15],
          [9, 3],
          [9, 9],
          [9, 15],
          [15, 3],
          [15, 15]
        ],
        8: [
          [3, 3],
          [3, 9],
          [3, 15],
          [9, 3],
          [9, 15],
          [15, 3],
          [15, 9],
          [15, 15]
        ],
        9: [
          [3, 3],
          [3, 9],
          [3, 15],
          [9, 3],
          [9, 9],
          [9, 15],
          [15, 3],
          [15, 9],
          [15, 15]
        ]
      };

      Object.keys(o).forEach(k => {
        var handicapStoneCount = Number(k);
        var game = new Game({ handicapStones: handicapStoneCount });

        var nonEmptyPoints = game.currentState().intersections.filter(i => !i.isEmpty());
        expect(nonEmptyPoints.length).to.equal(o[k].length);
        o[k].forEach(([y, x]) => {
          var realValue = game.intersectionAt(y, x).value;
          expect(realValue, "expected " + y + "-" + x + " to be black, but it's " + realValue).to.equal("black");
        });
      });
    });
  });

  describe("default placement on 13x13", function() {
    it("is at the correct hoshi points", function() {
      var game = new Game({ boardSize: 13 });

      expect(game.isBlackPlaying()).to.be.true;

      var o = {
        2: [
          [3, 9],
          [9, 3]
        ],
        3: [
          [3, 9],
          [9, 3],
          [9, 9]
        ],
        4: [
          [3, 3],
          [3, 9],
          [9, 3],
          [9, 9]
        ],
        5: [
          [3, 3],
          [3, 9],
          [6, 6],
          [9, 3],
          [9, 9]
        ],
        6: [
          [3, 3],
          [6, 3],
          [9, 3],
          [3, 9],
          [6, 9],
          [9, 9]
        ],
        7: [
          [3, 3],
          [3, 9],
          [6, 3],
          [6, 6],
          [6, 9],
          [9, 3],
          [9, 9]
        ],
        8: [
          [3, 3],
          [3, 6],
          [3, 9],
          [6, 3],
          [6, 9],
          [9, 3],
          [9, 6],
          [9, 9]
        ],
        9: [
          [3, 3],
          [3, 6],
          [3, 9],
          [6, 3],
          [6, 6],
          [6, 9],
          [9, 3],
          [9, 6],
          [9, 9]
        ]
      };

      Object.keys(o).forEach(k => {
        var handicapStoneCount = Number(k);
        var game = new Game({ boardSize: 13, handicapStones: handicapStoneCount });

        var nonEmptyPoints = game.currentState().intersections.filter(i => !i.isEmpty());

        expect(nonEmptyPoints.length).to.equal(o[k].length);
        o[k].forEach(([y, x]) => {
          var realValue = game.intersectionAt(y, x).value;
          expect(realValue, "expected " + y + "-" + x + " to be black, but it's " + realValue).to.equal("black");
        });
      });
    });
  });

  describe("default placement on 9x9", function() {
    it("is at the correct hoshi points", function() {
      var game = new Game({ boardSize: 9 });

      expect(game.isBlackPlaying()).to.be.true;

      var o = {
        2: [
          [2, 6],
          [6, 2]
        ],
        3: [
          [2, 6],
          [6, 2],
          [6, 6]
        ],
        4: [
          [2, 2],
          [2, 6],
          [6, 2],
          [6, 6]
        ],
        5: [
          [2, 2],
          [2, 6],
          [4, 4],
          [6, 2],
          [6, 6]
        ],
        6: [
          [2, 2],
          [4, 2],
          [6, 2],
          [2, 6],
          [4, 6],
          [6, 6]
        ],
        7: [
          [2, 2],
          [2, 6],
          [4, 2],
          [4, 4],
          [4, 6],
          [6, 2],
          [6, 6]
        ],
        8: [
          [2, 2],
          [2, 4],
          [2, 6],
          [4, 2],
          [4, 6],
          [6, 2],
          [6, 4],
          [6, 6]
        ],
        9: [
          [2, 2],
          [2, 4],
          [2, 6],
          [4, 2],
          [4, 4],
          [4, 6],
          [6, 2],
          [6, 4],
          [6, 6]
        ]
      };

      Object.keys(o).forEach(k => {
        var handicapStoneCount = Number(k);
        var game = new Game({ boardSize: 9, handicapStones: handicapStoneCount });

        var nonEmptyPoints = game.currentState().intersections.filter(i => !i.isEmpty());

        expect(nonEmptyPoints.length).to.equal(o[k].length);
        o[k].forEach(([y, x]) => {
          var realValue = game.intersectionAt(y, x).value;
          expect(realValue, "expected " + y + "-" + x + " to be black, but it's " + realValue).to.equal("black");
        });
      });
    });
  });

  describe("handicap scoring", function() {
    it("counts each handicap stone in area scoring but not territory", function() {
      [
        {
          scoring: "territory",
          handicap: 5,
          initialScore: { white: 0, black: 361 - 5 },
          expectedScore: { white: 0, black: 0 }
        },
        {
          scoring: "area",
          handicap: 5,
          initialScore: { white: 0, black: 361 },
          expectedScore: { white: 2, black: 1+5 } },
        {
          scoring: "equivalence",
          handicap: 5,
          initialScore: { white: 1, black: 361+2 },
          expectedScore: { white: 2+2, black: 1+5+2 }
        }
      ].forEach(function({ handicap, scoring, initialScore, expectedScore }) {
        var game = new Game({ handicapStones: handicap, scoring: scoring });

        game.pass(); // w
        game.pass(); // b

        if (scoring === "equivalence") {
          game.pass(); // w
        }

        expect(game.score().white).to.equal(initialScore["white"]);
        expect(game.score().black).to.equal(initialScore["black"]);

        game.undo();
        game.undo();

        if (scoring === "equivalence") {
          game.undo();
        }

        game.playAt(1, 1); // w
        game.pass(); // b
        game.playAt(1, 2); // w
        game.playAt(1, 3); // b

        game.pass(); // w
        game.pass(); // b

        if (scoring === "equivalence") {
          game.pass(); // w
        }

        expect(game.score().white).to.equal(expectedScore["white"]);
        expect(game.score().black).to.equal(expectedScore["black"]);
      });
    })
  });

  describe("free handicap placement", function() {
    it("is off by default", function() {
      var game = new Game({ handicapStones: 2 });

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
      var game = new Game({ handicapStones: 2, freeHandicapPlacement: true });

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
      var game = new Game({ handicapStones: 2, freeHandicapPlacement: true });

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
});
