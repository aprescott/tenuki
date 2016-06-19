var expect = require("chai").expect;
var tenuki = require("../index.js");
var Client = tenuki.Client;

var nullClientHooks = {
  submitPlay: function() {},
  submitPass: function() {},
  submitMarkDeadAt: function() {}
};

describe("Client", function() {
  var jsdom = require("jsdom");
  var document = jsdom.jsdom('<!doctype html><html><body><div id="test-board" class="tenuki-board"></div></body></html>');
  var window = document.defaultView;

  global["document"] = document;
  global["window"] = window;
  global["navigator"] = { userAgent: "node.js" };
  global["HTMLElement"] = global["window"].HTMLElement;

  afterEach(function() {
    document.querySelector("#test-board").innerHTML = "";
  });

  describe("setup", function() {
    it("accepts a black or white player configuration", function() {
      ["black", "white"].forEach(function(player) {
        var client = new Client();
        expect(function() { client.setup({ player: player, gameOptions: { boardSize: 9 }, hooks: nullClientHooks }); }).to.not.throw(Error);
      });

      ["Black", "White", "gibberish"].forEach(function(player) {
        var client = new Client();
        expect(function() { client.setup({ player: player, gameOptions: { boardSize: 9 }, hooks: nullClientHooks }); }).to.throw(Error, "Player must be either black or white, but was given: " + player);
      });
    });
  });

  describe("submitPlay hook", function() {
    it("handles playing at a given point when the board element is clicked", function(done) {
      var testBoardElement = document.querySelector("#test-board");

      var client = new Client(testBoardElement);
      client.setup({
        player: "black",
        gameOptions: { boardSize: 9 },
        hooks: {
          submitPlay: function(playedY, playedX, result) {
            expect(playedY).to.eq(0);
            expect(playedX).to.eq(5);
            expect(client._game.intersectionAt(playedY, playedX).value).to.eq("empty");

            result(false);
            expect(client._game.intersectionAt(playedY, playedX).value).to.eq("empty");

            // this is super hacky because usually you shouldn't call the callback twice!
            result(true);
            expect(client._game.intersectionAt(playedY, playedX).value).to.eq("black");

            done();
          },
          submitMarkDeadAt: function(y, x, stones, result) {
          },
          submitPass: function(result) {
          }
        }
      });

      testBoardElement.querySelectorAll(".intersection")[0*9 + 5].click();
    });

    it("plays a white move if the player is white", function() {
      var testBoardElement = document.querySelector("#test-board");

      var client = new Client(testBoardElement);
      client.setup({
        player: "white",
        gameOptions: { boardSize: 9 },
        hooks: {
          submitPlay: function(playedY, playedX, result) {
            expect(playedY).to.eq(0);
            expect(playedX).to.eq(5);
            expect(client._game.intersectionAt(playedY, playedX).value).to.eq("empty");

            result(false);
            expect(client._game.intersectionAt(playedY, playedX).value).to.eq("empty");

            // this is super hacky because usually you shouldn't call the callback twice!
            result(true);
            expect(client._game.intersectionAt(playedY, playedX).value).to.eq("white");

            done();
          },
          submitMarkDeadAt: function(y, x, stones, result) {
          },
          submitPass: function(result) {
          }
        }
      });

      client.receivePlay(4, 4);
      testBoardElement.querySelectorAll(".intersection")[0*9 + 5].click();
    });
  });

  describe("submitPass hook", function() {
    it("handles passing when client.pass() is called", function(done) {
      var testBoardElement = document.querySelector("#test-board");

      var client = new Client(testBoardElement);
      client.setup({
        player: "black",
        gameOptions: { boardSize: 9 },
        hooks: {
          submitPlay: function(playedY, playedX, result) {
          },
          submitMarkDeadAt: function(y, x, stones, result) {
          },
          submitPass: function(result) {
            expect(!!client._game.currentState().pass).to.eq(false);

            result(false);
            expect(!!client._game.currentState().pass).to.eq(false);

            // this is super hacky because usually you shouldn't call the callback twice!
            result(true);
            expect(!!client._game.currentState().pass).to.eq(true);

            done();
          }
        }
      });

      client.pass();
    });
  });

  describe("submitMarkDeadAt hook", function() {
    it("toggles stones dead when the game is over and a stone is clicked", function(done) {
      var testBoardElement = document.querySelector("#test-board");

      var client = new Client(testBoardElement);
      client.setup({
        player: "black",
        gameOptions: { boardSize: 9 },
        hooks: {
          submitPlay: function(playedY, playedX, result) {
          },
          submitMarkDeadAt: function(y, x, stones, result) {
            expect(stones.length).to.eq(2);
            expect(stones[0].y).to.eq(0);
            expect(stones[0].x).to.eq(5);
            expect(stones[1].y).to.eq(0);
            expect(stones[1].x).to.eq(6);

            result(true);

            done();
          },
          submitPass: function(result) {
          }
        }
      });

      // TODO: fix this?
      client._game.playAt(0, 5);
      client.receivePlay(1, 5);
      client._game.playAt(0, 6);
      client.receivePass();
      client._game.pass();

      testBoardElement.querySelectorAll(".intersection")[0*9 + 5].click();
    });
  });
});
