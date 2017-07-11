/*
 * This is a minimal, toy, demo server.
 *
 * It exists purely to demonstrate what an application
 * using `Client` might look like. It is not an example
 * of how to write a production-ready server for multiple
 * clients.
 */

var express = require("express");
var app = express();
var bodyParser = require("body-parser");

app.set('etag', false); // turn off etags which affects caching
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(bodyParser.json()); // for parsing application/json

var tenuki = require("../build/tenuki.js");
var Game = tenuki.Game;

var game = new Game({ boardSize: 9 });

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get("/game-info", function(req, res) {
  var gameState = game.currentState();

  res.json({
    moveNumber: gameState.moveNumber,
    y: gameState.playedPoint && gameState.playedPoint.y,
    x: gameState.playedPoint && gameState.playedPoint.x,
    pass: gameState.pass,
    phase: game.isOver() ? "scoring" : "active",
    deadStones: game.deadStones()
  });
});

app.post("/play-at", function(req, res) {
  var y = Number(req.body["y"]);
  var x = Number(req.body["x"]);
  var result = game.playAt(y, x);

  res.json({ result: result });
});

app.post("/pass", function(req, res) {
  var result = game.pass();

  res.json({ result: result });
});

app.post("/mark-dead-at", function(req, res) {
  var y = Number(req.body["y"]);
  var x = Number(req.body["x"]);
  var result = game.toggleDeadAt(y, x);

  res.json({ result: result });
});

app.listen(3000, function () {
  console.log("Example app listening on port 3000!");
});
