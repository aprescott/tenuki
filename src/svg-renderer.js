import utils from "./utils";
import Renderer from "./renderer";

const SVGRenderer = function(boardElement, { hooks, options }) {
  Renderer.call(this, boardElement, { hooks: hooks, options: options });
  utils.addClass(boardElement, "tenuki-svg-renderer");
};

SVGRenderer.prototype = Object.create(Renderer.prototype);
SVGRenderer.prototype.constructor = SVGRenderer;

const CACHED_CONSTRUCTED_LINES = {};

const constructSVG = function(renderer, boardState, { hasCoordinates, smallerStones, flatStones }) {
  const cacheKey = [boardState.boardSize, hasCoordinates, smallerStones, flatStones].toString();

  const svg = utils.createSVGElement("svg");
  const defs = utils.createSVGElement("defs");
  utils.appendElement(svg, defs);

  const blackGradient = utils.createSVGElement("radialGradient", {
    attributes: {
      id: renderer.blackGradientID,
      cy: "15%",
      r: "50%"
    }
  });
  utils.appendElement(blackGradient, utils.createSVGElement("stop", {
    attributes: {
      offset: "0%",
      "stop-color": "hsl(0, 0%, 38%)"
    }
  }));
  utils.appendElement(blackGradient, utils.createSVGElement("stop", {
    attributes: {
      offset: "100%",
      "stop-color": "#39363D"
    }
  }));
  utils.appendElement(defs, blackGradient);

  const whiteGradient = utils.createSVGElement("radialGradient", {
    attributes: {
      id: renderer.whiteGradientID,
      cy: "15%",
      r: "50%"
    }
  });
  utils.appendElement(whiteGradient, utils.createSVGElement("stop", {
    attributes: {
      offset: "0%",
      "stop-color": "#FFFFFF"
    }
  }));
  utils.appendElement(whiteGradient, utils.createSVGElement("stop", {
    attributes: {
      offset: "100%",
      "stop-color": "#fafdfc"
    }
  }));
  utils.appendElement(defs, whiteGradient);

  const contentsContainer = utils.createSVGElement("g", {
    attributes: {
      class: "contents",
      transform: `translate(${renderer.MARGIN}, ${renderer.MARGIN})`
    }
  });
  utils.appendElement(svg, contentsContainer);

  let lines;

  if (CACHED_CONSTRUCTED_LINES[cacheKey]) {
    lines = utils.clone(CACHED_CONSTRUCTED_LINES[cacheKey]);
  } else {
    lines = utils.createSVGElement("g", {
      attributes: {
        class: "lines"
      }
    });

    for (let y = 0; y < boardState.boardSize - 1; y++) {
      for (let x = 0; x < boardState.boardSize - 1; x++) {
        const lineBox = utils.createSVGElement("rect", {
          attributes: {
            y: y * (renderer.INTERSECTION_GAP_SIZE + 1) - 0.5,
            x: x * (renderer.INTERSECTION_GAP_SIZE + 1) - 0.5,
            width: renderer.INTERSECTION_GAP_SIZE + 1,
            height: renderer.INTERSECTION_GAP_SIZE + 1,
            class: "line-box"
          }
        });

        utils.appendElement(lines, lineBox);
      }
    }

    CACHED_CONSTRUCTED_LINES[cacheKey] = lines;
  }

  utils.appendElement(contentsContainer, lines);

  const hoshiPoints = utils.createSVGElement("g", { attributes: { class: "hoshi" }});
  utils.appendElement(contentsContainer, hoshiPoints);

  Renderer.hoshiPositionsFor(boardState.boardSize).forEach(h => {
    const hoshi = utils.createSVGElement("circle", {
      attributes: {
        class: "hoshi",
        cy: h.top * (renderer.INTERSECTION_GAP_SIZE + 1) - 0.5,
        cx: h.left * (renderer.INTERSECTION_GAP_SIZE + 1) - 0.5,
        r: 2
      }
    });

    utils.appendElement(hoshiPoints, hoshi);
  });

  if (hasCoordinates) {
    const coordinateContainer = utils.createSVGElement("g", {
      attributes: {
        class: "coordinates",
        transform: `translate(${renderer.MARGIN}, ${renderer.MARGIN})`
      }
    });

    for (let y = 0; y < boardState.boardSize; y++) {
      // TODO: 16 is for the rendered height _on my browser_. not reliable...

      [16/2 + 1 - (16 + 16/2 + 16/(2*2) + 16/(2*2*2)), 16/2 + 1 + (16 + 16/2) + (boardState.boardSize - 1)*(renderer.INTERSECTION_GAP_SIZE + 1)].forEach(verticalOffset => {
        utils.appendElement(coordinateContainer, utils.createSVGElement("text", {
          text: boardState.xCoordinateFor(y),
          attributes: {
            "text-anchor": "middle",
            y: verticalOffset - 0.5,
            x: y * (renderer.INTERSECTION_GAP_SIZE + 1) - 0.5
          }
        }));
      });


      [-1*(16 + 16/2 + 16/(2*2)), (16 + 16/2 + 16/(2*2)) + (boardState.boardSize - 1)*(renderer.INTERSECTION_GAP_SIZE + 1)].forEach(horizontalOffset => {
        utils.appendElement(coordinateContainer, utils.createSVGElement("text", {
          text: boardState.yCoordinateFor(y),
          attributes: {
            "text-anchor": "middle",
            y: y * (renderer.INTERSECTION_GAP_SIZE + 1) - 0.5 + 16/(2*2),
            x: horizontalOffset - 0.5
          }
        }));
      });

      utils.appendElement(svg, coordinateContainer);
    }
  }

  const intersections = utils.createSVGElement("g", { attributes: { class: "intersections" }});

  for (let y = 0; y < boardState.boardSize; y++) {
    for (let x = 0; x < boardState.boardSize; x++) {
      const intersectionGroup = utils.createSVGElement("g", {
        attributes: {
          class: "intersection"
        }
      });
      intersectionGroup.setAttribute("data-intersection-y", y);
      intersectionGroup.setAttribute("data-intersection-x", x);
      utils.appendElement(intersections, intersectionGroup);

      const intersectionInnerContainer = utils.createSVGElement("g", {
        attributes: {
          class: "intersection-inner-container"
        }
      });
      utils.appendElement(intersectionGroup, intersectionInnerContainer);

      const intersectionBox = utils.createSVGElement("rect", {
        attributes: {
          y: y * (renderer.INTERSECTION_GAP_SIZE + 1) - renderer.INTERSECTION_GAP_SIZE/2 - 0.5,
          x: x * (renderer.INTERSECTION_GAP_SIZE + 1) - renderer.INTERSECTION_GAP_SIZE/2 - 0.5,
          width: renderer.INTERSECTION_GAP_SIZE,
          height: renderer.INTERSECTION_GAP_SIZE
        }
      });
      utils.appendElement(intersectionInnerContainer, intersectionBox);

      let stoneRadius = renderer.INTERSECTION_GAP_SIZE / 2;

      if (smallerStones) {
        stoneRadius -= 1;
      }

      const stoneAttributes = {
        class: "stone",
        cy: y * (renderer.INTERSECTION_GAP_SIZE + 1) - 0.5,
        cx: x * (renderer.INTERSECTION_GAP_SIZE + 1) - 0.5,
        r: stoneRadius
      };

      if (!flatStones) {
        utils.appendElement(intersectionInnerContainer, utils.createSVGElement("circle", {
          attributes: {
            class: "stone-shadow",
            cy: stoneAttributes["cy"] + 2,
            cx: stoneAttributes["cx"],
            r: stoneRadius
          }
        }));
      }

      const intersection = utils.createSVGElement("circle", {
        attributes: stoneAttributes
      });
      utils.appendElement(intersectionInnerContainer, intersection);

      utils.appendElement(intersectionInnerContainer, utils.createSVGElement("circle", {
        attributes: {
          class: "marker",
          cy: y * (renderer.INTERSECTION_GAP_SIZE + 1) - 0.5,
          cx: x * (renderer.INTERSECTION_GAP_SIZE + 1) - 0.5,
          r: 4.5
        }
      }));

      utils.appendElement(intersectionInnerContainer, utils.createSVGElement("rect", {
        attributes: {
          class: "ko-marker",
          y: y * (renderer.INTERSECTION_GAP_SIZE + 1) - 6 - 0.5,
          x: x * (renderer.INTERSECTION_GAP_SIZE + 1) - 6 - 0.5,
          width: 12,
          height: 12
        }
      }));

      utils.appendElement(intersectionInnerContainer, utils.createSVGElement("rect", {
        attributes: {
          class: "territory-marker",
          y: y * (renderer.INTERSECTION_GAP_SIZE + 1) - 6,
          x: x * (renderer.INTERSECTION_GAP_SIZE + 1) - 6,
          width: 11,
          height: 11
        }
      }));

      renderer.grid[y] = renderer.grid[y] || [];
      renderer.grid[y][x] = intersectionGroup;

      renderer.addIntersectionEventListeners(intersectionGroup, y, x);
    }
  }

  utils.appendElement(contentsContainer, intersections);

  return svg;
};

SVGRenderer.prototype.generateBoard = function(boardState, { hasCoordinates, smallerStones, flatStones }) {
  this.blackGradientID = utils.randomID("black-gradient");
  this.whiteGradientID = utils.randomID("white-gradient");

  const svg = constructSVG(this, boardState, { hasCoordinates, smallerStones, flatStones });

  this.svgElement = svg;
  this.svgElement.setAttribute("height", this.BOARD_LENGTH);
  this.svgElement.setAttribute("width", this.BOARD_LENGTH);

  return svg;
};

SVGRenderer.prototype.computeSizing = function() {
  Renderer.prototype.computeSizing.call(this);

  // In addition to the will-change re-raster in Renderer,
  // the SVG element appears to sometimes need this to
  // prevent blurriness on resize.
  this.svgElement.style.transform = "none";

  window.requestAnimationFrame(() => {
    this.svgElement.style.transform = "";
  });
};

SVGRenderer.prototype.setIntersectionClasses = function(intersectionEl, intersection, classes) {
  if (intersectionEl.getAttribute("class") !== classes.join(" ")) {
    intersectionEl.setAttribute("class", classes.join(" "));
  }

  if (!this.flatStones) {
    if (intersection.isEmpty()) {
      intersectionEl.querySelector(".stone").setAttribute("style", "");
    } else {
      const base = window.location.href.split('#')[0];
      intersectionEl.querySelector(".stone").setAttribute("style", "fill: url(" + base + "#" + this[intersection.value + "GradientID"] + ")");
    }
  }
};

export default SVGRenderer;
