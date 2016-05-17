var expect = require("chai").expect;
var tenuki = require("../index.js");
var Game = tenuki.Game;

describe("basic gameplay functionality", function() {
  it("works", function() {
    var game = new Game();
    game.setup();
    expect(game.playAt(5, 10)).to.be.true;
    expect(game.playAt(5, 11)).to.be.true;
    expect(game.playAt(5, 11)).to.be.false;
    game.pass();
    game.pass();
    game.toggleDeadAt(5, 11);
    expect(game.isOver()).to.be.true;
    expect(game.score()).to.deep.equal({ black: 361, white: 0 });
  });
});
