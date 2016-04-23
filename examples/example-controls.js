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
    newGameInfo += "Black stones captured: " + this.game.currentMove().blackStonesCaptured;
    newGameInfo += "\n\n";
    newGameInfo +=  "White stones captured: " + this.game.currentMove().whiteStonesCaptured;
    newGameInfo += "\n\n";

    newGameInfo += "Move " + this.game.moves.length;

    if (this.game.currentMove() && !this.game.currentMove().pass) {
      newGameInfo += " (" + this.game.coordinatesFor(this.game.currentMove().y, this.game.currentMove().x) + ")";
    }

    newGameInfo += "\n\n";

    var currentMove = this.game.currentMove();

    if (currentMove) {
      var player = currentMove.color[0].toUpperCase() + currentMove.color.substr(1);

      if (currentMove.pass) {
        newGameInfo += player + " passed."
      }
    }

    this.gameInfo.innerText = newGameInfo;

    if (typeof currentMove != "undefined" && currentMove.pass) {
      var str = "";

      if (this.game.isOver()) {
        str += "Game over.";
        str += "\n\n"
        str += "Territory scoring: Black has " + this.game.territoryScore().black;
        str += "\n\n";
        str += "Territory scoring: White has " + this.game.territoryScore().white;
        str += "\n\n"
        str += "Area scoring: Black has " + this.game.areaScore().black;
        str += "\n\n"
        str += "Area scoring: White has " + this.game.areaScore().white;
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

      var player = controls.game.currentPlayer;
      controls.game.pass();
      controls.updateStats();
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
