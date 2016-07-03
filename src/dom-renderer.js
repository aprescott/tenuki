import utils from "./utils";
import Renderer from "./renderer";

const DOMRenderer = function(boardElement, { hooks, options }) {
  Renderer.call(this, boardElement, { hooks: hooks, options: options });

  if (this.smallerStones) {
    utils.addClass(boardElement, "tenuki-smaller-stones");
  }

  utils.addClass(boardElement, "tenuki-dom-renderer");
};

DOMRenderer.prototype = Object.create(Renderer.prototype);
DOMRenderer.prototype.constructor = DOMRenderer;

DOMRenderer.prototype._setup = function(boardState) {
  Renderer.prototype._setup.call(this, boardState);

  this.BOARD_LENGTH += 1;
  this.computeSizing();
};

DOMRenderer.prototype.generateBoard = function(boardState) {
  const renderer = this;
  const boardElement = this.boardElement;
  const zoomContainer = renderer.zoomContainer;

  utils.appendElement(zoomContainer, utils.createElement("div", { class: "lines horizontal" }));
  utils.appendElement(zoomContainer, utils.createElement("div", { class: "lines vertical" }));
  utils.appendElement(zoomContainer, utils.createElement("div", { class: "hoshi-points" }));
  utils.appendElement(zoomContainer, utils.createElement("div", { class: "intersections" }));

  Renderer.hoshiPositionsFor(boardState.boardSize).forEach(h => {
    const hoshi = utils.createElement("div", { class: "hoshi" });
    hoshi.style.left = (h.left * (renderer.INTERSECTION_GAP_SIZE + 1)) + "px";
    hoshi.style.top = (h.top * (renderer.INTERSECTION_GAP_SIZE + 1)) + "px";

    utils.appendElement(boardElement.querySelector(".hoshi-points"), hoshi);
  });

  for (let y = 0; y < boardState.boardSize; y++) {
    const horizontalLine = utils.createElement("div", { class: "line horizontal" });
    horizontalLine.setAttribute("data-left-gutter", boardState.yCoordinateFor(y));
    utils.appendElement(boardElement.querySelector(".lines.horizontal"), horizontalLine);

    const verticalLine = utils.createElement("div", { class: "line vertical" });
    verticalLine.setAttribute("data-top-gutter", boardState.xCoordinateFor(y));
    utils.appendElement(boardElement.querySelector(".lines.vertical"), verticalLine);

    for (let x = 0; x < boardState.boardSize; x++) {
      const intersectionElement = utils.createElement("div", { class: "intersection empty" });
      const stoneElement = utils.createElement("div", { class: "stone" });
      utils.appendElement(intersectionElement, stoneElement);

      intersectionElement.setAttribute("data-position-x", x);
      intersectionElement.setAttribute("data-position-y", y);

      intersectionElement.style.left = (x * (renderer.INTERSECTION_GAP_SIZE + 1)) + "px";
      intersectionElement.style.top = (y * (renderer.INTERSECTION_GAP_SIZE + 1)) + "px";

      utils.appendElement(boardElement.querySelector(".intersections"), intersectionElement);

      renderer.grid[y] = renderer.grid[y] || [];
      renderer.grid[y][x] = intersectionElement;

      this.addIntersectionEventListeners(intersectionElement, y, x);
    }
  }

  // prevent the text-selection cursor
  utils.addEventListener(boardElement.querySelector(".lines.horizontal"), "mousedown", function(e) {
    e.preventDefault();
  });
  utils.addEventListener(boardElement.querySelector(".lines.vertical"), "mousedown", function(e) {
    e.preventDefault();
  });

  boardElement.querySelector(".lines.horizontal").style.width = ((renderer.INTERSECTION_GAP_SIZE * (boardState.boardSize - 1)) + boardState.boardSize) + "px";
  boardElement.querySelector(".lines.horizontal").style.height = ((renderer.INTERSECTION_GAP_SIZE * (boardState.boardSize - 1)) + boardState.boardSize) + "px";
  boardElement.querySelector(".lines.vertical").style.width = ((renderer.INTERSECTION_GAP_SIZE * (boardState.boardSize - 1)) + boardState.boardSize) + "px";
  boardElement.querySelector(".lines.vertical").style.height = ((renderer.INTERSECTION_GAP_SIZE * (boardState.boardSize - 1)) + boardState.boardSize) + "px";
};

DOMRenderer.prototype.setIntersectionClasses = function(intersectionEl, intersection, classes) {
  if (intersectionEl.className !== classes.join(" ")) {
    intersectionEl.className = classes.join(" ");
  }
};

export default DOMRenderer;
