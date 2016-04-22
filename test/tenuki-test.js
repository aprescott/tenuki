var expect = require("chai").expect;
var tenuki = require("../index.js");
var Game = tenuki.Game;

describe("basic gameplay functionality", function() {
  it("works", function() {
    var game = new Game();
    game.setup();
    expect(game.playAt(5, 10)).to.be.true;
    expect(game.playAt(5, 10)).to.be.false;
    game.pass();
    game.pass();
    expect(game.areaScore()).to.deep.equal({ black: 361, white: 0 });
  });
});
