var expect = require("chai").expect;
var tenuki = require("../index.js");
var Game = tenuki.Game;

describe("seki detection", function() {
  it("does not count a false eye in seki as territory", function() {
    var game = new Game();

    // ┌─○─┬─●─○─┬─
    // ●─○─●─●─○─┼─
    // ├─●─●─○─┼─┼─
    // ●─●─○─┼─┼─┼─
    // ○─○─┼─┼─┼─┼─
    // ├─┼─┼─┼─┼─┼─
    game.playAt(0, 1); // b ○
    game.playAt(1, 0); // w ●
    game.playAt(1, 1); // b
    game.playAt(2, 1); // w
    game.playAt(0, 4); // b
    game.playAt(0, 3); // w
    game.playAt(1, 4); // b
    game.playAt(1, 3); // w
    game.playAt(2, 3); // b
    game.playAt(1, 2); // w
    game.playAt(3, 2); // b
    game.playAt(2, 2); // w
    game.playAt(4, 1); // b
    game.playAt(3, 1); // w
    game.playAt(4, 0); // b
    game.playAt(3, 0); // w

    game.pass();
    game.pass();

    expect(game.score().black).to.equal(342);
    expect(game.score().white).to.equal(0);
  });

  it("does not count two false eyes in a seki as territory", function() {
    var game = new Game();

    // ┌─○─┬─●─○─┬─┬─┬─
    // ●─○─●─●─○─┼─┼─┼─
    // ├─●─┼─●─○─┼─┼─┼─
    // ●─●─●─○─┼─○─┼─┼─
    // ○─○─○─○─┼─┼─┼─┼─
    // ├─┼─┼─┼─┼─┼─┼─┼─
    // ├─┼─┼─┼─┼─┼─┼─┼─
    game.playAt(0, 1); // b
    game.playAt(1, 0); // w
    game.playAt(1, 1); // b
    game.playAt(2, 1); // w
    game.playAt(0, 4); // b
    game.playAt(1, 2); // w
    game.playAt(1, 4); // b
    game.playAt(1, 3); // w
    game.playAt(2, 4); // b
    game.playAt(0, 3); // w
    game.playAt(3, 3); // b
    game.playAt(2, 3); // w
    game.playAt(3, 5); // b
    game.playAt(3, 2); // w
    game.playAt(4, 3); // b
    game.playAt(3, 1); // w
    game.playAt(4, 2); // b
    game.playAt(3, 0); // w

    game.playAt(4, 1); // b
    game.pass(); // w
    game.playAt(4, 0); // b

    game.pass();
    game.pass();

    expect(game.score().white).to.equal(0)
  });

  it("does not count seki with two 1-eyed groups", function() {
    var game = new Game({ boardSize: 9 });

    // ┌─○─┬─●─┬─●─○─┬─○
    // ○─○─○─●─●─●─○─○─┤
    // ●─●─●─○─○─○─○─┼─○
    // ●─┼─●─○─┼─┼─┼─┼─┤
    // ├─●─●─○─┼─┼─┼─┼─┤
    // ●─●─○─○─┼─┼─┼─┼─┤
    // ○─○─○─┼─┼─┼─┼─┼─┤
    // ├─┼─┼─┼─┼─┼─┼─┼─┤
    // └─┴─┴─┴─┴─┴─┴─┴─┘
    game.playAt(1, 0);
    game.playAt(2, 0);
    game.playAt(1, 1);
    game.playAt(2, 1);
    game.playAt(0, 1);
    game.playAt(2, 2);
    game.playAt(1, 2);
    game.playAt(1, 3);
    game.playAt(2, 3);
    game.playAt(0, 3);
    game.playAt(2, 4);
    game.playAt(1, 4);
    game.playAt(2, 5);
    game.playAt(1, 5);
    game.playAt(2, 6);
    game.playAt(0, 5);
    game.playAt(1, 6);
    game.pass();
    game.playAt(0, 6);
    game.playAt(3, 2);
    game.playAt(1, 7);
    game.playAt(4, 2);
    game.playAt(0, 8);
    game.playAt(4, 1);
    game.playAt(2, 8);
    game.playAt(5, 1);
    game.playAt(3, 3);
    game.playAt(5, 0);
    game.playAt(4, 3);
    game.playAt(3, 0);
    game.playAt(5, 3);
    game.pass();
    game.playAt(5, 2);
    game.pass();
    game.playAt(6, 2);
    game.pass();
    game.playAt(6, 1);
    game.pass();
    game.playAt(6, 0);

    game.pass();
    game.pass();

    expect(game.score().white).to.equal(2)
    expect(game.score().black).to.equal(42)
  });

  it("merges territories across 'thick' boundaries and skips what would otherwise be seki", function() {
    var game = new Game();

    // ┌─○─○─┬─○─●─┬─┬─
    // ○─○─○─○─○─●─┼─┼─
    // ●─●─●─●─●─●─┼─┼─
    // ├─┼─┼─┼─┼─┼─┼─┼─
    // ├─┼─┼─┼─┼─┼─┼─┼─
    game.playAt(0, 1);
    game.playAt(2, 1);
    game.playAt(1, 1);
    game.playAt(2, 0);
    game.playAt(1, 0);
    game.playAt(2, 2);
    game.playAt(1, 2);
    game.playAt(2, 3);
    game.playAt(0, 2);
    game.playAt(2, 4);
    game.playAt(1, 3);
    game.playAt(2, 5);
    game.playAt(1, 4);
    game.playAt(1, 5);
    game.playAt(0, 4);
    game.playAt(0, 5);

    game.pass();
    game.pass();

    expect(game.score().black).to.equal(2)
    expect(game.score().white).to.equal(343)
  });

  it("does _not_ ignore false-looking eyes in groups that are alive after filling those false-looking eyes", function() {
    var game = new Game();

    // ┌─○─┬─○─┬─○─┬─○─●─┬─┬─
    // ○─○─○─●─○─○─○─○─●─┼─┼─
    // ●─●─●─●─●─●─●─●─●─┼─┼─
    // ├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─
    // ├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─
    game.playAt(0, 1);
    game.playAt(2, 1);
    game.playAt(1, 1);
    game.playAt(2, 2);
    game.playAt(1, 2);
    game.playAt(1, 3);
    game.playAt(0, 3);
    game.playAt(2, 3);
    game.playAt(1, 0);
    game.playAt(2, 0);
    game.playAt(1, 4);
    game.playAt(2, 4);
    game.playAt(1, 5);
    game.playAt(2, 5);
    game.playAt(0, 5);
    game.playAt(2, 6);
    game.playAt(1, 6);
    game.playAt(2, 7);
    game.playAt(1, 7);
    game.playAt(2, 8);
    game.playAt(0, 7);
    game.playAt(1, 8);
    game.pass()
    game.playAt(0, 8);

    game.pass();
    game.pass();

    expect(game.score().black).to.equal(4);
  });

  it("does not ignore false eyes that should be filled in under correct play if the sequence is not sufficiently played out", function() {
    var game = new Game();

    // ┌─○─┬─○─┬─┬─○─●─┬─┬─
    // ○─○─○─●─○─○─○─●─┼─┼─
    // ●─●─●─●─●─●─●─●─┼─┼─
    // ├─┼─┼─┼─┼─┼─┼─┼─┼─┼─
    // ├─┼─┼─┼─┼─┼─┼─┼─┼─┼─
    game.playAt(1, 0);
    game.playAt(2, 0);
    game.playAt(1, 1);
    game.playAt(2, 1);
    game.playAt(0, 1);
    game.playAt(2, 2);
    game.playAt(1, 2);
    game.playAt(1, 3);
    game.playAt(0, 3);
    game.playAt(2, 4);
    game.playAt(1, 4);
    game.playAt(2, 3);
    game.playAt(1, 5);
    game.playAt(2, 5);
    game.playAt(1, 6);
    game.playAt(2, 6);
    game.playAt(0, 6);
    game.playAt(1, 7);
    game.pass();
    game.playAt(0, 7);
    game.pass();
    game.playAt(2, 7);

    game.pass();
    game.pass();

    expect(game.score().black).to.equal(4);
  });

  it("ignores false eyes which will disappear due to direct atari, after filling neutral points, which can affect the status of live groups", function() {
    var game = new Game();

    // ┌─○─○─┬─┬─○─┬─┬─○─┬─┬─○─┬─●─┬─
    // ●─●─●─○─○─●─○─○─●─○─○─●─○─●─┼─
    // ├─┼─┼─●─●─●─●─●─●─●─●─●─●─●─┼─
    // ├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─
    // ├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─
    // ├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─
    game.playAt(0, 1);
    game.playAt(1, 0);
    game.playAt(0, 2);
    game.playAt(1, 1);
    game.playAt(1, 3);
    game.playAt(1, 2);
    game.playAt(1, 4);
    game.playAt(2, 3);
    game.playAt(0, 5);
    game.playAt(2, 4);
    game.playAt(1, 6);
    game.playAt(2, 5);
    game.playAt(1, 7);
    game.playAt(1, 5);
    game.playAt(0, 8);
    game.playAt(2, 6);
    game.playAt(1, 9);
    game.playAt(2, 7);
    game.playAt(1, 10);
    game.playAt(2, 8);
    game.playAt(0, 11);
    game.playAt(1, 8);
    game.playAt(1, 12);
    game.playAt(2, 9);
    game.pass();
    game.playAt(2, 10);
    game.pass();
    game.playAt(2, 11);
    game.pass();
    game.playAt(1, 11);
    game.pass();
    game.playAt(2, 12);
    game.pass();
    game.playAt(2, 13);
    game.pass();
    game.playAt(1, 13);
    game.pass();
    game.playAt(0, 13);

    game.pass();
    game.pass();

    expect(game.score().black).to.equal(0)
  });

  it("ignores false eyes that are the last remaining points after filling dame", function() {
    var game = new Game();

    // ┌─○─○─┬─┬─○─┬─○─┬─○─●─┬─┬─┬─
    // ●─●─●─○─○─○─○─○─○─○─●─┼─┼─┼─
    // ├─┼─┼─●─●─●─●─●─●─●─●─┼─┼─┼─
    // ├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─
    // ├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─
    game.playAt(0, 1);
    game.playAt(1, 0);
    game.playAt(0, 2);
    game.playAt(1, 1);
    game.playAt(1, 3);
    game.playAt(1, 2);
    game.playAt(1, 4);
    game.playAt(2, 3);
    game.playAt(1, 5);
    game.playAt(2, 4);
    game.playAt(1, 6);
    game.playAt(2, 5);
    game.playAt(1, 7);
    game.playAt(2, 6);
    game.playAt(1, 8);
    game.playAt(2, 7);
    game.playAt(1, 9);
    game.playAt(2, 8);
    game.playAt(0, 9);
    game.playAt(2, 9);
    game.playAt(0, 7);
    game.playAt(2, 10);
    game.playAt(0, 5);
    game.playAt(1, 10);
    game.pass();
    game.playAt(0, 10);

    game.pass();
    game.pass();

    expect(game.score().black).to.equal(3)
  });

  it("ignores false eyes in the corner", function() {
    var game = new Game({ boardSize: 9 });

    game.playAt(1, 0);
    game.playAt(2, 0);
    game.playAt(0, 1);
    game.playAt(1, 1);
    game.playAt(1, 2);
    game.playAt(2, 2);
    game.playAt(1, 3);
    game.playAt(2, 3);
    game.playAt(1, 4);
    game.playAt(2, 4);
    game.playAt(1, 5);
    game.playAt(2, 5);
    game.playAt(1, 6);
    game.playAt(2, 6);
    game.playAt(1, 7);
    game.playAt(2, 7);
    game.playAt(1, 8);
    game.playAt(2, 8);
    game.playAt(0, 7);
    game.playAt(2, 1);
    game.playAt(0, 4);

    game.pass();
    game.pass();

    expect(game.score().black).to.equal(4)
  });

  it("counts eyepoints as territory for groups separated by bamboo-type connections", function() {
    var game = new Game();

    var run = function(game) {
      // ●─●─●─●─●─●─●─●─●─┬─
      // ●─○─○─○─┼─○─○─○─●─┼─
      // ●─○─┼─○─┼─○─┼─○─●─┼─
      // ●─○─○─○─┼─○─○─○─●─┼─
      // ●─●─●─●─●─●─●─●─●─┼─
      // ├─┼─┼─┼─┼─┼─┼─┼─┼─┼─
      game.playAt(1, 1);
      game.playAt(0, 1);
      game.playAt(2, 1);
      game.playAt(0, 0);
      game.playAt(1, 2);
      game.playAt(1, 0);
      game.playAt(1, 3);
      game.playAt(2, 0);
      game.playAt(3, 1);
      game.playAt(3, 0);
      game.playAt(3, 2);
      game.playAt(4, 0);
      game.playAt(3, 3);
      game.playAt(4, 1);
      game.playAt(2, 3);
      game.playAt(4, 2);
      game.playAt(1, 5);
      game.playAt(4, 3);
      game.playAt(2, 5);
      game.playAt(4, 4);
      game.playAt(3, 5);
      game.playAt(4, 5);
      game.playAt(3, 6);
      game.playAt(4, 6);
      game.playAt(3, 7);
      game.playAt(4, 7);
      game.playAt(2, 7);
      game.playAt(4, 8);
      game.playAt(1, 7);
      game.playAt(3, 8);
      game.playAt(1, 6);
      game.playAt(2, 8);
      game.pass();
      game.playAt(1, 8);
      game.pass();
      game.playAt(0, 8);
      game.pass();
      game.playAt(0, 7);
      game.pass();
      game.playAt(0, 6);
      game.pass();
      game.playAt(0, 5);
      game.pass();
      game.playAt(0, 4);
      game.pass();
      game.playAt(0, 3);
      game.pass();
      game.playAt(0, 2);
    };

    run(game);

    game.pass();
    game.pass();

    expect(game.score().black).to.equal(2);

    // test the same thing, but now by symmetry against white
    // to test the alternating pattern behavior

    game = new Game();

    game.pass();
    run(game);

    game.pass();
    game.pass();

    expect(game.score().white).to.equal(2);
  });

  it("ignores territory for two 1-eyed groups that can't connect out to live groups", function() {
    var game = new Game({ boardSize: 9 });

    // ●─┬─●─○─┬─┬─○─●─┐
    // ├─●─●─○─┼─┼─○─●─●
    // ●─●─┼─○─┼─┼─○─●─┤
    // ●─○─○─○─┼─┼─○─●─┤
    // ●─┼─●─○─┼─┼─○─●─●
    // ●─┼─●─○─○─○─○─●─●
    // ○─○─○─●─●─●─○─○─●
    // ├─○─┼─●─┼─●─┼─┼─●
    // ○─○─●─●─●─●─○─○─●
    var run = function(game) {
      game.playAt(8, 0);
      game.playAt(8, 2);
      game.playAt(8, 1);
      game.playAt(8, 3);
      game.playAt(7, 1);
      game.playAt(7, 3);
      game.playAt(6, 1);
      game.playAt(6, 3);
      game.playAt(6, 0);
      game.playAt(6, 4);
      game.playAt(6, 2);
      game.playAt(6, 5);
      game.playAt(8, 6);
      game.playAt(7, 5);
      game.playAt(8, 7);
      game.playAt(8, 5);
      game.playAt(6, 6);
      game.playAt(8, 8);
      game.playAt(6, 7);
      game.playAt(7, 8);
      game.playAt(5, 6);
      game.playAt(8, 4);
      game.playAt(5, 5);
      game.playAt(6, 8);
      game.playAt(5, 4);
      game.playAt(5, 8);
      game.playAt(5, 3);
      game.playAt(5, 2);
      game.playAt(4, 3);
      game.playAt(4, 2);
      game.playAt(3, 3);
      game.playAt(5, 0);
      game.playAt(3, 2);
      game.playAt(4, 0);
      game.playAt(3, 1);
      game.playAt(3, 0);
      game.pass();
      game.playAt(2, 0);
      game.pass();
      game.playAt(4, 8);
      game.pass();
      game.playAt(4, 7);
      game.pass();
      game.playAt(3, 7);
      game.pass();
      game.playAt(2, 7);
      game.pass();
      game.playAt(1, 7);
      game.pass();
      game.playAt(0, 7);
      game.pass();
      game.playAt(1, 8);
      game.playAt(4, 6);
      game.playAt(2, 1);
      game.playAt(3, 6);
      game.playAt(1, 1);
      game.playAt(2, 6);
      game.playAt(0, 0);
      game.playAt(1, 6);
      game.playAt(0, 2);
      game.playAt(0, 6);
      game.playAt(1, 2);
      game.playAt(2, 3);
      game.pass();
      game.playAt(1, 3);
      game.pass();
      game.playAt(0, 3);
      game.playAt(5, 7);
    };

    run(game);

    game.pass();
    game.pass();

    expect(game.score().black).to.equal(10);
    expect(game.score().white).to.equal(5);

    // test the same thing, but now by symmetry against white
    // to test the alternating pattern behavior

    game = new Game({ boardSize: 9 });

    game.pass();
    run(game);

    game.pass();
    game.pass();

    expect(game.score().white).to.equal(10);
    expect(game.score().black).to.equal(5);
  });

  it("ignores eyes in seki, but accounts for dead stone marking correctly", function() {
    var game = new Game();

    // ┌─○─●─┬─●─○─┬─┬─
    // ○─┼─●─●─●─○─┼─┼─
    // ●─●─●─○─○─○─┼─┼─
    // ○─○─○─○─┼─┼─┼─┼─
    // ├─┼─┼─┼─┼─┼─┼─┼─
    game.playAt(0, 1) // b
    game.playAt(0, 2) // w
    game.playAt(1, 0) // b
    game.playAt(1, 2) // w
    game.playAt(0, 5) // b
    game.playAt(1, 3) // w
    game.playAt(1, 5) // b
    game.playAt(1, 4) // w
    game.playAt(2, 5) // b
    game.playAt(0, 4) // w
    game.playAt(2, 4) // b
    game.playAt(2, 2) // w
    game.playAt(2, 3) // b
    game.playAt(2, 1) // w
    game.playAt(3, 3) // b
    game.playAt(2, 0) // w
    game.playAt(3, 2) // b
    game.playAt(10, 10) // w tenuki
    game.playAt(3, 1) // b
    game.playAt(10, 11) // w tenuki
    game.playAt(3, 0) // b

    game.pass();
    game.pass();

    expect(game.score().black).to.equal(0);
    expect(game.score().white).to.equal(0);

    // mark seki white group dead
    game.toggleDeadAt(2, 2);

    expect(game.score().black).to.equal(11 + 8);
    expect(game.score().white).to.equal(0);

    // mark the outer white group dead
    game.toggleDeadAt(10, 10);

    expect(game.score().white).to.equal(0);

    // 8 dead white stones double-counted as territory + 3 empty points
    // + 2 outer dead stones double-counted as territory + all remaining empty points
    expect(game.score().black).to.equal(8*2 + 3 + 2*2 + 337)

    // unmark white dead
    game.toggleDeadAt(2, 2);
    game.toggleDeadAt(10, 10);

    expect(game.score().black).to.equal(0);
    expect(game.score().white).to.equal(0);

    // mark both black stones dead
    game.toggleDeadAt(0, 1);

    expect(game.score().black).to.equal(0);

    // 2 dead black stones double-counted as territory + 3 empty points
    expect(game.score().white).to.equal(2*2 + 3)
  });
});
