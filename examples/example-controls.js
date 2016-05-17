// An example setup showing how buttons could be set to board/game functionality.
ExampleGameControls = function(element, game) {
  this.element = element;
  this.game = game;
  this.textInfo = element.querySelector(".text-info p");
  this.gameInfo = element.querySelector(".game-info p");

  this.setText = function(str) {
    this.textInfo.innerText = str;
  };

  this.updateStats = function() {
    var newGameInfo = "";
    newGameInfo += "Black stones captured: " + this.game.boardState().blackStonesCaptured;
    newGameInfo += "\n\n";
    newGameInfo +=  "White stones captured: " + this.game.boardState().whiteStonesCaptured;
    newGameInfo += "\n\n";

    newGameInfo += "Move " + this.game.boardState().moveNumber;

    if (this.game.boardState().playedPoint) {
      newGameInfo += " (" + this.game.coordinatesFor(this.game.boardState().playedPoint.y, this.game.boardState().playedPoint.x) + ")";
    }

    newGameInfo += "\n\n";

    var boardState = this.game.boardState();

    if (boardState.pass) {
      var player = boardState.color[0].toUpperCase() + boardState.color.substr(1);
      newGameInfo += player + " passed."
    }

    this.gameInfo.innerText = newGameInfo;

    if (boardState.pass) {
      var str = "";

      if (this.game.isOver()) {
        str += "Game over.";
        str += "\n\n"
        str += "Black's score is " + this.game.score().black;
        str += "\n\n";
        str += "White's score is " + this.game.score().white;
      }

      this.setText(str)
    } else {
      this.setText("");
    }
  };

  this.setup = function() {
    var controls = this;

    var passButton = document.querySelector(".pass");
    var undoButton = document.querySelector(".undo");
    var texturedButton = document.querySelector(".textured");

    passButton.addEventListener("click", function(e) {
      e.preventDefault();

      controls.game.pass();
    });

    undoButton.addEventListener("click", function(e) {
      e.preventDefault();

      controls.game.undo();
    });

    texturedButton.addEventListener("click", function(e) {
      e.preventDefault();

      controls.game.renderer.boardElement.classList.toggle("tenuki-board-textured");
    });
  }
};
