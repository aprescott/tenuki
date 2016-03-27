ExampleBoardControls = function(element, board) {
  this.element = element;
  this.board = board;
  this.textInfo = null;
  this.gameInfo = null;

  this.setText = function(str) {
    this.textInfo.innerText = str;
  };

  this.updateStats = function() {
    this.gameInfo.innerText = "Move " + this.board.moves.length + ". Black stones captured: " + this.board.captures["black"] + ". White stones captured: " + this.board.captures["white"];

    var currentMove = this.board.currentMove();

    if (typeof currentMove != "undefined" && currentMove.pass) {
      this.setText(currentMove.color[0].toUpperCase() + currentMove.color.substr(1) + " passes.")
    } else {
      this.setText("");
    }
  };

  this.setup = function() {
    var controls = this;

    var passButton = document.querySelector(".pass");
    var undoButton = document.querySelector(".undo");
    var texturedButton = document.querySelector(".textured");

    tenuki.utils.addEventListener(passButton, "click", function(e) {
      e.preventDefault();

      var player = controls.board.currentPlayer;
      controls.board.pass();
      controls.updateStats();
    });

    tenuki.utils.addEventListener(undoButton, "click", function(e) {
      e.preventDefault();

      controls.board.undo();
    });

    tenuki.utils.addEventListener(texturedButton, "click", function(e) {
      e.preventDefault();

      tenuki.utils.toggleClass(controls.board.element, "textured");
    });

    var controlLinks = controls.element.querySelectorAll("a");
    for (var i = 0; i < controlLinks.length; i++) {
      var linkEl = controlLinks.item(i);

      tenuki.utils.addEventListener(linkEl, "click", function(e) {
      });
    }
  }
};
