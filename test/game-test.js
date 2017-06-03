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

  describe("playAt", function() {
    it("is true or false depending on move success", function() {
      var game = new Game();
      game.setup();

      expect(game.playAt(5, 10)).to.be.true;
      expect(game.playAt(5, 11)).to.be.true;
      expect(game.playAt(5, 11)).to.be.false;
    });

    it("starts with black and alternates", function() {
      var game = new Game();
      game.setup();

      game.playAt(5, 5);
      expect(game.intersectionAt(5, 5).value).to.equal("black");

      game.playAt(5, 6);
      expect(game.intersectionAt(5, 6).value).to.equal("white");
    });
  });

  describe("capturing", function() {
    it("removes black stones from the board", function() {
      var game = new Game();
      game.setup();

      game.playAt(0, 0); // b
      game.playAt(0, 1); // w
      game.playAt(1, 1); // b
      game.playAt(1, 0); // w, capturing

      expect(game.intersectionAt(0, 0).isEmpty()).to.be.true;
      expect(game.currentState().blackStonesCaptured).to.equal(1)
      expect(game.currentState().whiteStonesCaptured).to.equal(0)
    });

    it("removes white stones from the board", function() {
      var game = new Game();
      game.setup();

      game.pass(); // b
      game.playAt(0, 0); // w
      game.playAt(0, 1); // b
      game.playAt(1, 1); // w
      game.playAt(1, 0); // b, capturing

      expect(game.intersectionAt(0, 0).isEmpty()).to.be.true;
      expect(game.currentState().blackStonesCaptured).to.equal(0)
      expect(game.currentState().whiteStonesCaptured).to.equal(1)
    });

    it("removes multi-stone groups from the board", function() {
      var game = new Game();
      game.setup();

      game.playAt(0, 0); // b
      game.playAt(0, 1); // w
      game.playAt(1, 0); // b
      game.playAt(1, 1); // w
      game.playAt(5, 5); // b tenuki
      game.playAt(2, 0); // w, capturing

      expect(game.intersectionAt(0, 0).isEmpty()).to.be.true;
      expect(game.intersectionAt(1, 0).isEmpty()).to.be.true;

      expect(game.currentState().blackStonesCaptured).to.equal(2)
      expect(game.currentState().whiteStonesCaptured).to.equal(0)
    });

    it("removes multi-stone groups that share a liberty, counting unique spaces", function() {
      var game = new Game();
      game.setup();

      game.playAt(0, 1); // b
      game.playAt(0, 2); // w
      game.playAt(1, 1); // b
      game.playAt(1, 2); // w
      game.playAt(1, 0); // b
      game.playAt(2, 1); // w
      game.playAt(2, 2); // b
      game.playAt(2, 0); // w
      game.playAt(3, 3); // b
      game.playAt(0, 0); // w

      expect(game.currentState().blackStonesCaptured).to.equal(3)
      expect(game.currentState().whiteStonesCaptured).to.equal(0)
    });
  });

  describe("undo", function() {
    it("removes the last played stone", function() {
      var game = new Game();
      game.setup();

      game.playAt(5, 10); // b
      game.playAt(5, 11); // w
      game.playAt(5, 12); // b

      expect(game.currentPlayer()).to.equal("white");
      expect(game.intersectionAt(5, 12).value).to.equal("black");

      game.undo();

      expect(game.currentPlayer()).to.equal("black");
      expect(game.intersectionAt(5, 10).value).to.equal("black");
      expect(game.intersectionAt(5, 11).value).to.equal("white");
      expect(game.intersectionAt(5, 12).value).to.equal("empty");
    });
  });

  describe("isOver", function() {
    it("is false until two successive passes", function() {
      var game = new Game();
      game.setup();

      expect(game.isOver()).to.be.false;

      game.playAt(5, 5);
      expect(game.isOver()).to.be.false;

      game.pass();
      expect(game.isOver()).to.be.false;

      game.pass();
      expect(game.isOver()).to.be.true;
    });
  });

  describe("toggleDeadAt", function() {
    it("toggles stones dead as part of the scoring calculation", function() {
      var game = new Game();
      game.setup();

      game.playAt(5, 5);
      game.playAt(5, 6);

      game.pass();
      game.pass();

      expect(game.score()).to.deep.equal({ black: 0, white: 0 });

      game.toggleDeadAt(5, 6);

      expect(game.score()).to.deep.equal({ black: 361, white: 0 });

      game.toggleDeadAt(5, 6);

      expect(game.score()).to.deep.equal({ black: 0, white: 0 });
    });
  });

  describe("handicap stones", function() {
    it("defaults to no handicap stones", function() {
      var game = new Game();
      game.setup();

      expect(game.handicapStones).to.equal(0);
      expect(game.currentPlayer()).to.equal("black");

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

      [3, 5, 7, 11, 15, 17, 21].forEach(b => {
        expect(function() { game.setup({ boardSize: b, handicapStones: 2 }); }).to.throw(Error, "Handicap stones not supported on sizes other than 9x9, 13x13 and 19x19");
      });
    });

    it("treats handicap stone positions as illegal moves", function() {
      var game = new Game();
      game.setup({ handicapStones: 9 });

      expect(game.isIllegalAt(3, 3)).to.be.true;
    });
  });

  describe("komi", function() {
    it("does not add komi by default", function() {
      var game = new Game();
      game.setup();

      game.pass();
      game.pass();

      expect(game.isOver()).to.be.true;

      expect(game.score().black).to.equal(0);
      expect(game.score().white).to.equal(0);
    });

    it("supports integer and non-integer komi", function() {
      [0.5, 7, 7.5, 100].forEach(function(komiValue) {
        var game = new Game();
        game.setup({ komi: komiValue });

        game.pass();
        game.pass();

        expect(game.score().black).to.equal(0);
        expect(game.score().white).to.equal(komiValue);
      });
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

  describe("suicide restrictions", function() {
    it("prevents suicide", function() {
      var game = new Game();
      game.setup();

      // in the corner
      expect(game.playAt(0, 1)).to.be.true; // b
      expect(game.playAt(0, 2)).to.be.true; // w
      expect(game.playAt(1, 0)).to.be.true; // b
      expect(game.playAt(2, 0)).to.be.true; // w
      expect(game.playAt(15, 15)).to.be.true; // b tenuki
      expect(game.playAt(1, 1)).to.be.true; // w

      expect(game.playAt(0, 0)).to.be.false;
      expect(game.isIllegalAt(0, 0)).to.be.true;
      expect(game.intersectionAt(0, 0).isEmpty()).to.be.true;
      expect(game.isBlackPlaying()).to.be.true;

      expect(game.playAt(9, 9)).to.be.true; // b tenuki
      expect(game.playAt(0, 0)).to.be.true; // w

      expect(game.intersectionAt(0, 0).isWhite()).to.be.true;
    });
  });
});
