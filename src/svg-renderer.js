import utils from "./utils";
import Renderer from "./renderer";

const SVGRenderer = function(boardElement, { hooks, options }) {
  Renderer.call(this, boardElement, { hooks: hooks, options: options });
  utils.addClass(boardElement, "tenuki-svg-renderer");
};

SVGRenderer.prototype = Object.create(Renderer.prototype);
SVGRenderer.prototype.constructor = SVGRenderer;

SVGRenderer.prototype.generateBoard = function(boardState) {
  const renderer = this;
  const zoomContainer = renderer.zoomContainer;

  const svg = utils.createSVGElement("svg");
  renderer.svgElement = svg;

  const defs = utils.createSVGElement("defs");
  utils.appendElement(svg, defs);

  renderer.blackGradientID = utils.randomID("black-gradient");
  renderer.whiteGradientID = utils.randomID("white-gradient");

  const blackGradient = utils.createSVGElement("radialGradient", {
    attributes: {
      id: renderer.blackGradientID,
      cy: "0",
      r: "55%"
    }
  });
  utils.appendElement(blackGradient, utils.createSVGElement("stop", {
    attributes: {
      offset: "0%",
      "stop-color": "#848484"
    }
  }));
  utils.appendElement(blackGradient, utils.createSVGElement("stop", {
    attributes: {
      offset: "100%",
      "stop-color": "hsl(0, 0%, 20%)"
    }
  }));
  utils.appendElement(defs, blackGradient);

  const whiteGradient = utils.createSVGElement("radialGradient", {
    attributes: {
      id: renderer.whiteGradientID,
      cy: "0",
      r: "70%"
    }
  });
  utils.appendElement(whiteGradient, utils.createSVGElement("stop", {
    attributes: {
      offset: "0%",
      "stop-color": "white"
    }
  }));
  utils.appendElement(whiteGradient, utils.createSVGElement("stop", {
    attributes: {
      offset: "100%",
      "stop-color": "#DDDDDD"
    }
  }));
  utils.appendElement(defs, whiteGradient);

  const contentsContainer = utils.createSVGElement("g", {
    attributes: {
      class: "contents",
      transform: `translate(${this.MARGIN}, ${this.MARGIN})`
    }
  });

  const lines = utils.createSVGElement("g", {
    attributes: {
      class: "lines"
    }
  });
  utils.appendElement(contentsContainer, lines);

  for (let y = 0; y < boardState.boardSize - 1; y++) {
    for (let x = 0; x < boardState.boardSize - 1; x++) {
      const lineBox = utils.createSVGElement("rect", {
        attributes: {
          y: y * (this.INTERSECTION_GAP_SIZE + 1) - 0.5,
          x: x * (this.INTERSECTION_GAP_SIZE + 1) - 0.5,
          width: this.INTERSECTION_GAP_SIZE + 1,
          height: this.INTERSECTION_GAP_SIZE + 1,
          class: "line-box"
        }
      });

      utils.appendElement(lines, lineBox);
    }
  }

  const hoshiPoints = utils.createSVGElement("g", { attributes: { class: "hoshi" }});
  utils.appendElement(contentsContainer, hoshiPoints);

  Renderer.hoshiPositionsFor(boardState.boardSize).forEach(h => {
    const hoshi = utils.createSVGElement("circle", {
      attributes: {
        class: "hoshi",
        cy: h.top * (this.INTERSECTION_GAP_SIZE + 1) - 0.5,
        cx: h.left * (this.INTERSECTION_GAP_SIZE + 1) - 0.5,
        r: 2
      }
    });

    utils.appendElement(hoshiPoints, hoshi);
  });

  const intersections = utils.createSVGElement("g", { attributes: { class: "intersections" }});
  utils.appendElement(contentsContainer, intersections);

  if (this.hasCoordinates) {
    const coordinateContainer = utils.createSVGElement("g", {
      attributes: {
        class: "coordinates",
        transform: `translate(${this.MARGIN}, ${this.MARGIN})`
      }
    });

    for (let y = 0; y < boardState.boardSize; y++) {
      if (this.hasCoordinates) {
        // TODO: 16 is for the rendered height _on my browser_. not reliable...

        [16/2 + 1 - (16 + 16/2 + 16/(2*2) + 16/(2*2*2)), 16/2 + 1 + (16 + 16/2) + (boardState.boardSize - 1)*(this.INTERSECTION_GAP_SIZE + 1)].forEach(verticalOffset => {
          utils.appendElement(coordinateContainer, utils.createSVGElement("text", {
            text: boardState.xCoordinateFor(y),
            attributes: {
              "text-anchor": "middle",
              y: verticalOffset - 0.5,
              x: y * (this.INTERSECTION_GAP_SIZE + 1) - 0.5
            }
          }));
        });


        [-1*(16 + 16/2 + 16/(2*2)), (16 + 16/2 + 16/(2*2)) + (boardState.boardSize - 1)*(this.INTERSECTION_GAP_SIZE + 1)].forEach(horizontalOffset => {
          utils.appendElement(coordinateContainer, utils.createSVGElement("text", {
            text: boardState.yCoordinateFor(y),
            attributes: {
              "text-anchor": "middle",
              y: y * (this.INTERSECTION_GAP_SIZE + 1) - 0.5 + 16/(2*2),
              x: horizontalOffset - 0.5
            }
          }));
        });

        utils.appendElement(svg, coordinateContainer);
      }
    }
  }

  for (let y = 0; y < boardState.boardSize; y++) {
    for (let x = 0; x < boardState.boardSize; x++) {
      const intersectionGroup = utils.createSVGElement("g", {
        attributes: {
          class: "intersection"
        }
      });
      utils.appendElement(intersections, intersectionGroup);

      const intersectionInnerContainer = utils.createSVGElement("g", {
        attributes: {
          class: "intersection-inner-container"
        }
      });
      utils.appendElement(intersectionGroup, intersectionInnerContainer);

      const intersectionBox = utils.createSVGElement("rect", {
        attributes: {
          y: y * (this.INTERSECTION_GAP_SIZE + 1) - this.INTERSECTION_GAP_SIZE/2 - 0.5,
          x: x * (this.INTERSECTION_GAP_SIZE + 1) - this.INTERSECTION_GAP_SIZE/2 - 0.5,
          width: this.INTERSECTION_GAP_SIZE,
          height: this.INTERSECTION_GAP_SIZE
        }
      });
      utils.appendElement(intersectionInnerContainer, intersectionBox);

      let stoneRadius = this.INTERSECTION_GAP_SIZE / 2;

      if (this.smallerStones) {
        stoneRadius -= 1;
      }

      const stoneAttributes = {
        class: "stone",
        cy: y * (this.INTERSECTION_GAP_SIZE + 1) - 0.5,
        cx: x * (this.INTERSECTION_GAP_SIZE + 1) - 0.5,
        width: this.INTERSECTION_GAP_SIZE + 1,
        height: this.INTERSECTION_GAP_SIZE + 1,
        r: stoneRadius
      };

      if (this.texturedStones) {
        utils.appendElement(intersectionInnerContainer, utils.createSVGElement("circle", {
          attributes: {
            class: "stone-shadow",
            cy: stoneAttributes["cy"] + 2,
            cx: stoneAttributes["cx"],
            width: stoneAttributes["width"],
            height: stoneAttributes["height"],
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
          cy: y * (this.INTERSECTION_GAP_SIZE + 1) - 0.5,
          cx: x * (this.INTERSECTION_GAP_SIZE + 1) - 0.5,
          width: this.INTERSECTION_GAP_SIZE + 1,
          height: this.INTERSECTION_GAP_SIZE + 1,
          r: 4.5
        }
      }));

      utils.appendElement(intersectionInnerContainer, utils.createSVGElement("rect", {
        attributes: {
          class: "ko-marker",
          y: y * (this.INTERSECTION_GAP_SIZE + 1) - 6 - 0.5,
          x: x * (this.INTERSECTION_GAP_SIZE + 1) - 6 - 0.5,
          width: 12,
          height: 12
        }
      }));

      utils.appendElement(intersectionInnerContainer, utils.createSVGElement("rect", {
        attributes: {
          class: "territory-marker",
          y: y * (this.INTERSECTION_GAP_SIZE + 1) - 6,
          x: x * (this.INTERSECTION_GAP_SIZE + 1) - 6,
          width: 11,
          height: 11
        }
      }));

      this.grid[y] = this.grid[y] || [];
      this.grid[y][x] = intersectionGroup;

      this.addIntersectionEventListeners(intersectionGroup, y, x);
    }
  }

  utils.appendElement(svg, contentsContainer);
  utils.appendElement(zoomContainer, svg);

  renderer.svgElement.setAttribute("height", renderer.BOARD_LENGTH);
  renderer.svgElement.setAttribute("width", renderer.BOARD_LENGTH);
};

SVGRenderer.prototype.setIntersectionClasses = function(intersectionEl, intersection, classes) {
  if (intersectionEl.getAttribute("class") !== classes.join(" ")) {
    intersectionEl.setAttribute("class", classes.join(" "));
  }

  if (this.texturedStones) {
    if (intersection.isEmpty()) {
      intersectionEl.querySelector(".stone").setAttribute("style", "");
    } else {
      intersectionEl.querySelector(".stone").setAttribute("style", "fill: url(#" + this[intersection.value + "GradientID"] + ")");
    }
  }
};

export default SVGRenderer;
