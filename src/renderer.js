import utils from "./utils";

const Renderer = function(boardElement, { hooks, options }) {
  this.INTERSECTION_GAP_SIZE = 28;
  this.GUTTER_MARGIN = this.INTERSECTION_GAP_SIZE - 3;
  this.BASE_MARGIN = this.INTERSECTION_GAP_SIZE - 10;
  this.hasCoordinates = boardElement.hasAttribute("data-include-coordinates");
  this.MARGIN = this.hasCoordinates ? this.BASE_MARGIN + this.GUTTER_MARGIN : this.BASE_MARGIN;
  this.boardElement = boardElement;
  this.grid = [];
  this.hooks = hooks || {};
  this._options = options || {};
  this._initialized = false;

  if (this._options["fuzzyStonePlacement"]) {
    utils.addClass(boardElement, "tenuki-fuzzy-placement");
    utils.removeClass(boardElement, "tenuki-board-flat");
    utils.addClass(boardElement, "tenuki-board-nonflat");
    this.smallerStones = true;
  }

  this.flatStones = utils.hasClass(boardElement, "tenuki-board-flat");

  if (!this.flatStones) {
    utils.addClass(boardElement, "tenuki-board-nonflat");
  }
};

Renderer.hoshiPositionsFor = function(boardSize) {
  const hoshiElements = [];

  if (boardSize < 7) {
    if (boardSize > 1 && boardSize % 2 === 1) {
      const hoshi = {};
      hoshi.top = (boardSize - 1)/2;
      hoshi.left = hoshi.top;

      hoshiElements.push(hoshi);
    } else {
      // no hoshi
    }
  } else {
    const hoshiOffset = boardSize > 11 ? 3 : 2;

    for (let hoshiY = 0; hoshiY < 3; hoshiY++) {
      for (let hoshiX = 0; hoshiX < 3; hoshiX++) {
        if ((boardSize === 7 || boardSize % 2 === 0) && (hoshiY === 1 || hoshiX === 1)) {
          continue;
        }

        const hoshi = {};

        if (hoshiY === 0) {
          hoshi.top = hoshiOffset;
        }

        if (hoshiY === 1) {
          hoshi.top = (boardSize + 1)/2 - 1;
        }

        if (hoshiY === 2) {
          hoshi.top = boardSize - hoshiOffset - 1;
        }

        if (hoshiX === 0) {
          hoshi.left = hoshiOffset;
        }

        if (hoshiX === 1) {
          hoshi.left = (boardSize + 1)/2 - 1;
        }

        if (hoshiX === 2) {
          hoshi.left = boardSize - hoshiOffset - 1;
        }

        hoshiElements.push(hoshi);
      }
    }
  }

  return hoshiElements;
};

Renderer.prototype = {
  _setup: function(boardState) {
    const renderer = this;
    const boardElement = this.boardElement;

    renderer.BOARD_LENGTH = 2*this.MARGIN + (boardState.boardSize - 1)*(this.INTERSECTION_GAP_SIZE + 1);

    const innerContainer = utils.createElement("div", { class: "tenuki-inner-container" });
    renderer.innerContainer = innerContainer;
    utils.appendElement(boardElement, innerContainer);

    const zoomContainer = utils.createElement("div", { class: "tenuki-zoom-container" });
    renderer.zoomContainer = zoomContainer;
    utils.appendElement(innerContainer, zoomContainer);

    renderer.cancelZoomElement = utils.createElement("div", { class: "cancel-zoom" });
    const cancelZoomBackdrop = utils.createElement("div", { class: "cancel-zoom-backdrop" });
    utils.addEventListener(renderer.cancelZoomElement, "click", function(event) {
      event.preventDefault();
      renderer.zoomOut();

      return false;
    });
    utils.addEventListener(cancelZoomBackdrop, "click", function(event) {
      event.preventDefault();
      renderer.zoomOut();

      return false;
    });
    utils.appendElement(innerContainer, renderer.cancelZoomElement);
    utils.appendElement(innerContainer, cancelZoomBackdrop);

    // https://developer.mozilla.org/en-US/docs/Web/Events/resize
    const throttle = function(type, name) {
      let running = false;
      const func = function() {
        if (running) { return; }

        running = true;

        window.requestAnimationFrame(function() {
          window.dispatchEvent(new CustomEvent(name));
          running = false;
        });
      };
      window.addEventListener(type, func);
    };

    throttle("resize", "optimizedResize");

    const specificRendererBoard = this.generateBoard(boardState, {
      hasCoordinates: this.hasCoordinates,
      smallerStones: this.smallerStones,
      flatStones: this.flatStones
    });
    utils.appendElement(zoomContainer, specificRendererBoard);

    window.requestAnimationFrame(() => {
      // we'll potentially be zooming on touch devices
      zoomContainer.style.willChange = "transform";

      renderer.computeSizing();
    });

    window.addEventListener("optimizedResize", () => {
      renderer.computeSizing();
    });

    renderer.touchmoveChangedTouch = null;
    renderer.touchstartEventHandler = renderer.handleTouchStart.bind(renderer);
    renderer.touchmoveEventHandler = renderer.handleTouchMove.bind(renderer);
    renderer.touchendEventHandler = renderer.handleTouchEnd.bind(renderer);

    utils.addEventListener(renderer.innerContainer, "touchstart", renderer.touchstartEventHandler);
    utils.addEventListener(renderer.innerContainer, "touchend", renderer.touchendEventHandler);
    utils.addEventListener(renderer.innerContainer, "touchmove", renderer.touchmoveEventHandler);
  },

  computeSizing: function() {
    const renderer = this;
    const innerContainer = this.innerContainer;
    const zoomContainer = this.zoomContainer;
    const boardElement = this.boardElement;

    // reset everything so we can calculate against new values
    innerContainer.style.height = "";
    innerContainer.style.width = "";
    zoomContainer.style.height = "";
    zoomContainer.style.width = "";
    innerContainer.style.transform = "";
    // zoomContainer.style.willChange = "";
    boardElement.style.width = "";
    boardElement.style.height = "";

    // dev-friendly reset of whether this is a touch device
    renderer._touchEventFired = null;

    innerContainer.style.width = renderer.BOARD_LENGTH + "px";
    innerContainer.style.height = renderer.BOARD_LENGTH + "px";

    zoomContainer.style.width = renderer.BOARD_LENGTH + "px";
    zoomContainer.style.height = renderer.BOARD_LENGTH + "px";

    const scaleX = innerContainer.parentNode.clientWidth / innerContainer.clientWidth;
    const scaleY = innerContainer.parentNode.clientHeight / innerContainer.clientHeight;
    const scale = Math.min(scaleX, scaleY);

    if (scale > 0) {
      if (scale < 1) {
        utils.addClass(boardElement, "tenuki-scaled");
      } else {
        utils.removeClass(boardElement, "tenuki-scaled");
      }

      if (scale < 1 || scale > 1) {
        innerContainer.style["transform-origin"] = "top left";
        innerContainer.style.transform = "scale3d(" + scale + ", " + scale + ", 1)";
      }
    }

    // reset the outer element's height to match, ensuring that we free up any lingering whitespace
    boardElement.style.width = innerContainer.getBoundingClientRect().width + "px";
    boardElement.style.height = innerContainer.getBoundingClientRect().height + "px";

    // Work around lack of re-raster in Chrome. See https://github.com/w3c/csswg-drafts/issues/236
    // and https://bugs.chromium.org/p/chromium/issues/detail?id=600482 for more
    // information. This is preventing, e.g., horizontal/vertical line width
    // mismatches after scaling. By adding this, lines are re-rastered and are
    // all the same width, as if the user had hit refresh at the new viewport
    // size.
    zoomContainer.style.willChange = "";

    window.requestAnimationFrame(() => {
      zoomContainer.style.willChange = "transform";
    });
  },

  addIntersectionEventListeners: function(element, y, x) {
    const renderer = this;

    utils.addEventListener(element, "mouseenter", function() {
      const hoveredYPosition = y;
      const hoveredXPosition = x;
      const hoverValue = renderer.hooks.hoverValue(hoveredYPosition, hoveredXPosition);

      if (hoverValue) {
        utils.addClass(element, "hovered");
        utils.addClass(element, hoverValue);
      }
    });

    utils.addEventListener(element, "mouseleave", function() {
      if (utils.hasClass(this, "hovered")) {
        utils.removeClass(element, "hovered");
        utils.removeClass(element, "black");
        utils.removeClass(element, "white");
      }

      renderer.resetTouchedPoint();
    });

    utils.addEventListener(element, "click", function() {
      const playedYPosition = y;
      const playedXPosition = x;

      // if this isn't part of a touch,
      // or it is and the user is zoomed in,
      // or it's game over and we're marking stones dead,
      // then don't use the zoom/double-select system.
      if (!renderer._touchEventFired || (document.body.clientWidth / window.innerWidth > 1) || renderer.hooks.gameIsOver()) {
        renderer.hooks.handleClick(playedYPosition, playedXPosition);
        return;
      }

      if (renderer.touchedPoint) {
        if (element === renderer.touchedPoint) {
          renderer.hooks.handleClick(playedYPosition, playedXPosition);
        } else {
          renderer.showPossibleMoveAt(element, playedYPosition, playedXPosition);
        }
      } else {
        renderer.showPossibleMoveAt(element, playedYPosition, playedXPosition);
      }
    });
  },

  handleTouchStart: function(event) {
    const renderer = this;
    renderer._touchEventFired = true;

    if (event.touches.length > 1) {
      if (renderer.zoomedIn) {
        event.preventDefault();
      }
      return;
    }

    if (!renderer.zoomedIn) {
      return;
    }

    const xCursor = event.changedTouches[0].clientX;
    const yCursor = event.changedTouches[0].clientY;

    renderer.dragStartX = xCursor;
    renderer.dragStartY = yCursor;
    renderer.zoomContainer.style.transition = "none";
    renderer.animationFrameRequestID = window.requestAnimationFrame(renderer.processDragDelta.bind(renderer));
  },

  handleTouchMove: function(event) {
    const renderer = this;

    if (event.touches.length > 1) {
      return;
    }

    if (!renderer.zoomedIn) {
      return true;
    }

    // prevent pull-to-refresh
    event.preventDefault();

    renderer.touchmoveChangedTouch = event.changedTouches[0];

    renderer.moveInProgress = true;
  },

  handleTouchEnd: function(event) {
    const renderer = this;

    if (event.touches.length > 1) {
      return;
    }

    if (!renderer.zoomedIn) {
      return;
    }

    renderer.zoomContainer.style.transition = "";

    if (!renderer.moveInProgress) {
      return;
    }
    renderer.translateY = renderer.lastTranslateY;
    renderer.translateX = renderer.lastTranslateX;
    renderer.moveInProgress = false;
    renderer.touchmoveChangedTouch = null;
    window.cancelAnimationFrame(renderer.animationFrameRequestID);
  },

  processDragDelta: function() {
    const renderer = this;

    if (!renderer.touchmoveChangedTouch) {
      renderer.animationFrameRequestID = window.requestAnimationFrame(renderer.processDragDelta.bind(renderer));
      return;
    }

    const innerContainer = renderer.innerContainer;

    const xCursor = renderer.touchmoveChangedTouch.clientX;
    const yCursor = renderer.touchmoveChangedTouch.clientY;

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

    renderer.zoomContainer.style.transform = "translate3d(" + 2.5*translateX + "px, " + 2.5*translateY + "px, 0) scale3d(2.5, 2.5, 1)";

    renderer.lastTranslateX = translateX;
    renderer.lastTranslateY = translateY;

    renderer.animationFrameRequestID = window.requestAnimationFrame(renderer.processDragDelta.bind(renderer));
  },

  showPossibleMoveAt: function(intersectionElement, y, x) {
    const renderer = this;
    const boardElement = this.boardElement;
    const zoomContainer = this.zoomContainer;

    renderer.zoomContainerHeight = renderer.zoomContainerHeight || zoomContainer.clientHeight;
    renderer.zoomContainerWidth = renderer.zoomContainerWidth || zoomContainer.clientWidth;

    renderer.touchedPoint = intersectionElement;

    if (utils.hasClass(boardElement, "tenuki-scaled")) {
      const top = y * (this.INTERSECTION_GAP_SIZE + 1);
      const left = x * (this.INTERSECTION_GAP_SIZE + 1);

      const translateY = 0.5 * renderer.zoomContainerHeight - top - renderer.MARGIN;
      const translateX = 0.5 * renderer.zoomContainerWidth - left - renderer.MARGIN;

      zoomContainer.style.transform = "translate3d(" + 2.5*translateX + "px, " + 2.5*translateY + "px, 0) scale3d(2.5, 2.5, 1)";
      renderer.translateY = translateY;
      renderer.translateX = translateX;

      utils.addClass(renderer.cancelZoomElement, "visible");
      renderer.zoomedIn = true;
    }
  },

  resetTouchedPoint: function() {
    const renderer = this;

    renderer.touchedPoint = null;
  },

  zoomOut: function() {
    const renderer = this;

    this.resetTouchedPoint();
    renderer.zoomContainer.style.transform = "";
    renderer.zoomContainer.style.transition = "";
    renderer.dragStartX = null;
    renderer.dragStartY = null;
    renderer.translateY = null;
    renderer.translateX = null;
    renderer.lastTranslateX = null;
    renderer.lastTranslateY = null;

    utils.removeClass(renderer.cancelZoomElement, "visible");
    renderer.zoomedIn = false;
  },

  render: function(boardState, { territory, deadStones } = {}) {
    if (!this._initialized) {
      this._setup(boardState);
      this._initialized = true;
    }

    this.resetTouchedPoint();

    this.renderStonesPlayed(boardState.intersections);

    const playedPoint = boardState.playedPoint;

    this.updateMarkerPoints({ playedPoint: playedPoint, koPoint: boardState.koPoint });

    if (this._options["fuzzyStonePlacement"] && playedPoint) {
      const verticalShiftClasses = [
        "v-shift-up",
        "v-shift-upup",
        "v-shift-down",
        "v-shift-downdown",
        "v-shift-none"
      ];

      const horizontalShiftClasses = [
        "h-shift-left",
        "h-shift-leftleft",
        "h-shift-right",
        "h-shift-rightright",
        "h-shift-none"
      ];

      const shiftClasses = verticalShiftClasses.concat(horizontalShiftClasses);

      const alreadyShifted = shiftClasses.some(c => utils.hasClass(this.grid[playedPoint.y][playedPoint.x], c));

      if (!alreadyShifted) {
        const possibleShifts = utils.cartesianProduct(verticalShiftClasses, horizontalShiftClasses);
        const [playedVerticalShift, playedHorizontalShift] = possibleShifts[Math.floor(Math.random() * possibleShifts.length)];

        [
                   [-1, 0],
          [0, -1],          [0, 1],
                    [1, 0]
        ].forEach(([y, x]) => {
          if (this.grid[playedPoint.y + y] && this.grid[playedPoint.y + y][playedPoint.x + x]) {
            const neighboringElement = this.grid[playedPoint.y + y][playedPoint.x + x];

            if (!utils.hasClass(neighboringElement, "empty")) {
              [
                [-1, 0, "v-shift-downdown", "v-shift-up", "v-shift-down"],
                [-1, 0, "v-shift-downdown", "v-shift-upup", "v-shift-none"],
                [-1, 0, "v-shift-down", "v-shift-upup", "v-shift-none"],
                [1, 0, "v-shift-upup", "v-shift-down", "v-shift-up"],
                [1, 0, "v-shift-upup", "v-shift-downdown", "v-shift-none"],
                [1, 0, "v-shift-up", "v-shift-downdown", "v-shift-none"],

                [0, -1, "h-shift-rightright", "h-shift-left", "h-shift-right"],
                [0, -1, "h-shift-rightright", "h-shift-leftleft", "h-shift-none"],
                [0, -1, "h-shift-right", "h-shift-leftleft", "h-shift-none"],
                [0, 1, "h-shift-leftleft", "h-shift-right", "h-shift-left"],
                [0, 1, "h-shift-leftleft", "h-shift-rightright", "h-shift-none"],
                [0, 1, "h-shift-left", "h-shift-rightright", "h-shift-none"]
              ].forEach(([requiredYOffset, requiredXOffset, requiredNeighborShift, conflictingPlayedShift, newNeighborShift]) => {
                if (y === requiredYOffset && x === requiredXOffset && utils.hasClass(neighboringElement, requiredNeighborShift) && (playedVerticalShift === conflictingPlayedShift || playedHorizontalShift === conflictingPlayedShift)) {
                  utils.removeClass(neighboringElement, requiredNeighborShift);
                  utils.addClass(neighboringElement, newNeighborShift);
                }
              });
            }
          }
        });

        utils.addClass(this.grid[playedPoint.y][playedPoint.x], playedVerticalShift);
        utils.addClass(this.grid[playedPoint.y][playedPoint.x], playedHorizontalShift);
      }
    }

    if (deadStones.length > 0 || territory.black.length > 0 || territory.white.length > 0) {
      this.renderTerritory(territory, deadStones);
    }
  },

  renderStonesPlayed: function(intersections) {
    intersections.forEach(intersection => {
      this.renderIntersection(intersection);
    });
  },

  updateMarkerPoints: function({ playedPoint, koPoint }) {
    const renderer = this;

    if (koPoint) {
      utils.addClass(renderer.grid[koPoint.y][koPoint.x], "ko");
    }

    if (playedPoint) {
      utils.addClass(renderer.grid[playedPoint.y][playedPoint.x], "played");
    }
  },

  renderIntersection: function(intersection) {
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

      const shiftClasses = [
        "v-shift-up",
        "v-shift-upup",
        "v-shift-down",
        "v-shift-downdown",
        "v-shift-none",
        "h-shift-left",
        "h-shift-leftleft",
        "h-shift-right",
        "h-shift-rightright",
        "h-shift-none"
      ];

      shiftClasses.forEach(shiftClass => {
        if (utils.hasClass(intersectionEl, shiftClass)) {
          classes.push(shiftClass);
        }
      });
    }

    this.setIntersectionClasses(intersectionEl, intersection, classes);
  },

  renderTerritory: function(territory, deadStones) {
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
  }
};

export default Renderer;
