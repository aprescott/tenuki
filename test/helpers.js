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
