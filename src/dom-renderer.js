import utils from "./utils";

export default function DOMRenderer(boardElement, hooks = {}) {
  this.INTERSECTION_GAP_SIZE = 28;
  this.GUTTER_MARGIN = this.INTERSECTION_GAP_SIZE - 3;
  this.BASE_MARGIN = this.INTERSECTION_GAP_SIZE - 10;
  this.MARGIN = boardElement.hasAttribute("data-include-coordinates") ? this.BASE_MARGIN + this.GUTTER_MARGIN : this.BASE_MARGIN;
  this.boardElement = boardElement;
  this.grid = [];
  this.hooks = hooks;
  this._touchEventFired = false;
  this._initialized = false;

  this._setup = function(boardState) {
    const renderer = this;
    const boardElement = this.boardElement;

    const innerContainer = utils.createElement("div", { class: "tenuki-inner-container" });
    renderer.innerContainer = innerContainer;
    utils.appendElement(boardElement, innerContainer);

    const zoomContainer = utils.createElement("div", { class: "tenuki-zoom-container" });
    renderer.zoomContainer = zoomContainer;
    utils.appendElement(innerContainer, zoomContainer);

    utils.appendElement(zoomContainer, utils.createElement("div", { class: "lines horizontal" }));
    utils.appendElement(zoomContainer, utils.createElement("div", { class: "lines vertical" }));
    utils.appendElement(zoomContainer, utils.createElement("div", { class: "hoshi-points" }));
    utils.appendElement(zoomContainer, utils.createElement("div", { class: "intersections" }));

    renderer.cancelZoomElement = utils.createElement("div", { class: "cancel-zoom" });
    const cancelZoomBackdrop = utils.createElement("div", { class: "cancel-zoom-backdrop" });
    utils.addEventListener(renderer.cancelZoomElement, "click", function() {
      renderer.zoomOut();
    });
    utils.addEventListener(cancelZoomBackdrop, "click", function() {
      renderer.zoomOut();
    });
    utils.appendElement(innerContainer, renderer.cancelZoomElement);
    utils.appendElement(innerContainer, cancelZoomBackdrop);

    if (boardState.boardSize < 7) {
      if (boardState.boardSize > 1 && boardState.boardSize % 2 === 1) {
        const hoshi = utils.createElement("div", { class: "hoshi" });
        hoshi.style.top = (renderer.MARGIN + ((boardState.boardSize - 1)/2)*(renderer.INTERSECTION_GAP_SIZE + 1) - 2) + "px";
        hoshi.style.left = hoshi.style.top;

        utils.appendElement(boardElement.querySelector(".hoshi-points"), hoshi);
      } else {
        // no hoshi
      }
    } else {
      const hoshiOffset = boardState.boardSize > 11 ? 3 : 2;

      for (let hoshiY = 0; hoshiY < 3; hoshiY++) {
        for (let hoshiX = 0; hoshiX < 3; hoshiX++) {
          if ((boardState.boardSize === 7 || boardState.boardSize % 2 === 0) && (hoshiY === 1 || hoshiX === 1)) {
            continue;
          }

          const hoshi = utils.createElement("div", { class: "hoshi" });

          if (hoshiY === 0) {
            hoshi.style.top = (renderer.MARGIN + hoshiOffset*(renderer.INTERSECTION_GAP_SIZE + 1) - 2) + "px";
          }

          if (hoshiY === 1) {
            hoshi.style.top = (renderer.MARGIN + ((boardState.boardSize + 1)/2 - 1)*(renderer.INTERSECTION_GAP_SIZE + 1) - 2) + "px";
          }

          if (hoshiY === 2) {
            hoshi.style.top = (renderer.MARGIN + (boardState.boardSize - hoshiOffset - 1)*(renderer.INTERSECTION_GAP_SIZE + 1) - 2) + "px";
          }

          if (hoshiX === 0) {
            hoshi.style.left = (renderer.MARGIN + hoshiOffset*(renderer.INTERSECTION_GAP_SIZE + 1) - 2) + "px";
          }

          if (hoshiX === 1) {
            hoshi.style.left = (renderer.MARGIN + ((boardState.boardSize + 1)/2 - 1)*(renderer.INTERSECTION_GAP_SIZE + 1) - 2) + "px";
          }

          if (hoshiX === 2) {
            hoshi.style.left = (renderer.MARGIN + (boardState.boardSize - hoshiOffset - 1)*(renderer.INTERSECTION_GAP_SIZE + 1) - 2) + "px";
          }

          utils.appendElement(boardElement.querySelector(".hoshi-points"), hoshi);
        }
      }
    }

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

    const boardWidth = renderer.INTERSECTION_GAP_SIZE * (boardState.boardSize - 1) + boardState.boardSize + renderer.MARGIN*2;
    const boardHeight = renderer.INTERSECTION_GAP_SIZE * (boardState.boardSize - 1) + boardState.boardSize + renderer.MARGIN*2;

    innerContainer.style.width = boardWidth + "px";
    innerContainer.style.height = boardHeight + "px";

    zoomContainer.style.width = boardWidth + "px";
    zoomContainer.style.height = boardHeight + "px";

    utils.flatten(renderer.grid).forEach(function(intersectionEl) {
      utils.addEventListener(intersectionEl, "touchstart", function() {
        renderer._touchEventFired = true;
      });

      utils.addEventListener(intersectionEl, "mouseenter", function() {
        const intersectionElement = this;
        const hoveredYPosition = Number(intersectionElement.getAttribute("data-position-y"));
        const hoveredXPosition = Number(intersectionElement.getAttribute("data-position-x"));
        const hoverValue = renderer.hooks.hoverValue(hoveredYPosition, hoveredXPosition);

        if (hoverValue) {
          utils.addClass(intersectionElement, "hovered");
          utils.addClass(intersectionElement, hoverValue);
        }
      });

      utils.addEventListener(intersectionEl, "mouseleave", function() {
        const intersectionElement = this;

        if (utils.hasClass(this, "hovered")) {
          utils.removeClass(intersectionElement, "hovered");
          utils.removeClass(intersectionElement, "black");
          utils.removeClass(intersectionElement, "white");
        }

        renderer.resetTouchedPoint();
      });

      utils.addEventListener(intersectionEl, "click", function() {
        const intersectionElement = this;
        const playedYPosition = Number(intersectionElement.getAttribute("data-position-y"));
        const playedXPosition = Number(intersectionElement.getAttribute("data-position-x"));

        // if this isn't part of a touch,
        // or it is and the user is zoomed in,
        // or it's game over and we're marking stones dead,
        // then don't use the zoom/double-select system.
        if (!renderer._touchEventFired || (document.body.clientWidth / window.innerWidth > 1) || renderer.hooks.gameIsOver()) {
          renderer.hooks.handleClick(playedYPosition, playedXPosition);
          return;
        }

        if (renderer.touchedPoint) {
          if (intersectionElement === renderer.touchedPoint) {
            renderer.hooks.handleClick(playedYPosition, playedXPosition);
          } else {
            renderer.showPossibleMoveAt(intersectionElement);
          }
        } else {
          renderer.showPossibleMoveAt(intersectionElement);
        }
      });
    });

    const scaleX = innerContainer.parentNode.clientWidth / innerContainer.clientWidth;
    const scaleY = innerContainer.parentNode.clientHeight / innerContainer.clientHeight;
    const scale = Math.min(scaleX, scaleY);

    if (scale > 0 && scale < 1) {
      utils.addClass(boardElement, "tenuki-scaled");
      innerContainer.style["transform-origin"] = "top left";
      innerContainer.style.transform = "scale3d(" + scale + ", " + scale + ", 1)";

      // reset the outer element's height to match, ensuring that we free up any lingering whitespace
      boardElement.style.width = innerContainer.getBoundingClientRect().width + "px";
      boardElement.style.height = innerContainer.getBoundingClientRect().height + "px";
    }

    utils.addEventListener(boardElement, "touchstart", function(event) {
      if (event.touches.length > 1) {
        return;
      }

      if (!utils.hasClass(boardElement, "tenuki-zoomed")) {
        return;
      }

      const xCursor = event.changedTouches[0].clientX;
      const yCursor = event.changedTouches[0].clientY;

      renderer.dragStartX = xCursor;
      renderer.dragStartY = yCursor;
      zoomContainer.style.transition = "none";
    });

    utils.addEventListener(innerContainer, "touchend", function(event) {
      if (event.touches.length > 1) {
        return;
      }

      if (!utils.hasClass(boardElement, "tenuki-zoomed")) {
        return;
      }

      zoomContainer.style.transition = "";

      if (!renderer.moveInProgress) {
        return;
      }
      renderer.translateY = renderer.lastTranslateY;
      renderer.translateX = renderer.lastTranslateX;
      renderer.moveInProgress = false;
    });

    utils.addEventListener(innerContainer, "touchmove", function(event) {
      if (event.touches.length > 1) {
        return;
      }

      if (!utils.hasClass(boardElement, "tenuki-zoomed")) {
        return true;
      }

      // prevent pull-to-refresh
      event.preventDefault();

      renderer.moveInProgress = true;

      const xCursor = event.changedTouches[0].clientX;
      const yCursor = event.changedTouches[0].clientY;

      const deltaX = xCursor - renderer.dragStartX;
      const deltaY = yCursor - renderer.dragStartY;

      let translateY = renderer.translateY + deltaY/2.5;
      let translateX = renderer.translateX + deltaX/2.5;

      if (translateY > 0.5*innerContainer.clientHeight - renderer.MARGIN) {
        translateY = 0.5*innerContainer.clientHeight - renderer.MARGIN;
      }

      if (translateX > 0.5*innerContainer.clientWidth - renderer.MARGIN) {
        translateX = 0.5*innerContainer.clientWidth - renderer.MARGIN;
      }

      if (translateY < -0.5*innerContainer.clientHeight + renderer.MARGIN) {
        translateY = -0.5*innerContainer.clientHeight + renderer.MARGIN;
      }

      if (translateX < -0.5*innerContainer.clientWidth + renderer.MARGIN) {
        translateX = -0.5*innerContainer.clientWidth + renderer.MARGIN;
      }

      zoomContainer.style.transform = "translate3d(" + 2.5*translateX + "px, " + 2.5*translateY + "px, 0) scale3d(2.5, 2.5, 1)";

      renderer.lastTranslateX = translateX;
      renderer.lastTranslateY = translateY;
    });
  };

  this.showPossibleMoveAt = function(intersectionElement) {
    const renderer = this;
    const boardElement = this.boardElement;
    const zoomContainer = this.zoomContainer;

    renderer.touchedPoint = intersectionElement;

    if (utils.hasClass(boardElement, "tenuki-scaled")) {
      const top = intersectionElement.offsetTop;
      const left = intersectionElement.offsetLeft;

      const translateY = 0.5 * zoomContainer.clientHeight - top - renderer.MARGIN;
      const translateX = 0.5 * zoomContainer.clientWidth - left - renderer.MARGIN;

      zoomContainer.style.transform = "translate3d(" + 2.5*translateX + "px, " + 2.5*translateY + "px, 0) scale3d(2.5, 2.5, 1)";
      renderer.translateY = translateY;
      renderer.translateX = translateX;

      utils.addClass(renderer.cancelZoomElement, "visible");
      utils.addClass(renderer.boardElement, "tenuki-zoomed");
    }
  };

  this.resetTouchedPoint = function() {
    const renderer = this;

    renderer.touchedPoint = null;
  };

  this.zoomOut = function() {
    const renderer = this;
    const zoomContainer = renderer.zoomContainer;

    this.resetTouchedPoint();
    zoomContainer.style.transform = "";
    zoomContainer.style.transition = "";
    renderer.dragStartX = null;
    renderer.dragStartY = null;
    renderer.translateY = null;
    renderer.translateX = null;
    renderer.lastTranslateX = null;
    renderer.lastTranslateY = null;

    utils.removeClass(renderer.cancelZoomElement, "visible");
    utils.removeClass(renderer.boardElement, "tenuki-zoomed");
  };

  this.render = function(boardState, { territory, deadStones } = {}) {
    if (!this._initialized) {
      this._setup(boardState);
      this._initialized = true;
    }

    this.resetTouchedPoint();

    this.renderStonesPlayed(boardState.intersections);
    this.updateMarkerPoints({ playedPoint: boardState.playedPoint, koPoint: boardState.koPoint });

    if (territory) {
      this.renderTerritory(territory, deadStones);
    }
  };

  this.renderStonesPlayed = function(intersections) {
    intersections.forEach(intersection => {
      this.renderIntersection(intersection);
    });
  };

  this.updateMarkerPoints = function({ playedPoint, koPoint }) {
    const renderer = this;

    if (koPoint) {
      utils.addClass(renderer.grid[koPoint.y][koPoint.x], "ko");
    }

    if (playedPoint) {
      utils.addClass(renderer.grid[playedPoint.y][playedPoint.x], "marker");
    }
  };

  this.renderIntersection = function(intersection) {
    const renderer = this;

    const intersectionEl = renderer.grid[intersection.y][intersection.x];

    let classes = ["intersection"];

    if (intersection.isEmpty()) {
      classes.push("empty");
    } else {
      classes.push("occupied");

      if (intersection.isBlack()) {
        classes.push("black");
      } else {
        classes.push("white");
      }
    }

    if (intersectionEl.className !== classes.join(" ")) {
      intersectionEl.className = classes.join(" ");
    }
  };

  this.renderTerritory = function(territory, deadStones) {
    utils.flatten(this.grid).forEach(element => {
      utils.removeClass(element, "territory-black");
      utils.removeClass(element, "territory-white");
      utils.removeClass(element, "dead");
    });

    deadStones.forEach(point => {
      utils.addClass(this.grid[point.y][point.x], "dead");
    });

    territory.black.forEach(territoryPoint => {
      utils.addClass(this.grid[territoryPoint.y][territoryPoint.x], "territory-black");
    });

    territory.white.forEach(territoryPoint => {
      utils.addClass(this.grid[territoryPoint.y][territoryPoint.x], "territory-white");
    });
  };
}
