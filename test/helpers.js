var JSDOM = require("jsdom").JSDOM;
var window = new JSDOM('<!doctype html><html><body></body></html>').window;
var document = window.document;

global["document"] = document;
global["window"] = window;
// we don't really need this for these tests.
window.requestAnimationFrame = function() {};
global["navigator"] = { userAgent: "node.js" };
global["HTMLElement"] = global["window"].HTMLElement;

exports.generateNewTestBoard = function() {
  document.querySelector("body").innerHTML = '<div id="test-board" class="tenuki-board"></div>';
}

exports.printBoard = function(boardState) {
  var chars = {
    "black": "○",
    "white": "●",
    "empty": "┼"
  };

  var grid = [];

  boardState.intersections.forEach(i => {
    grid[i.y] = grid[i.y] || [];

    var c = chars[i.value];

    if (i.isEmpty()) {
      if (i.y == 0) {
        if (i.x == 0) {
          c = "┌"
        } else if (i.x == boardState.boardSize - 1) {
          c = "┐"
        } else {
          c = "┬"
        }
      } else if (i.y == boardState.boardSize - 1) {
        if (i.x == 0) {
          c = "└"
        } else if (i.x == boardState.boardSize - 1) {
          c = "┘"
        } else {
          c = "┴"
        }
      } else if (i.x == 0) {
        c = "├"
      } else if (i.x == boardState.boardSize - 1) {
        c = "┤"
      } else {
        c = "┼"
      }
    }

    grid[i.y][i.x] = c;
  });

  console.log(grid.map(row => row.join("─")).join("\n"));
}
