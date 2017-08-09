export default {
  flatten: function(ary) {
    return ary.reduce((a, b) => a.concat(b));
  },

  flatMap: function(ary, lambda) {
    return Array.prototype.concat.apply([], ary.map(lambda));
  },

  cartesianProduct: function(ary1, ary2) {
    return this.flatten(ary1.map(x => ary2.map(y => [x, y])));
  },

  randomID: function(prefix) {
    const str = [0, 1, 2, 3].map(() => {
      return Math.floor(Math.random() * 0x10000).toString(16).substring(1);
    }).join("");

    return `${prefix}-${str}`;
  },

  clone: function(element) {
    return element.cloneNode(true);
  },

  createElement: function(elementName, options) {
    const element = document.createElement(elementName);

    if (typeof options !== "undefined") {
      if (options.class) {
        element.className = options.class;
      }
    }

    return element;
  },

  createSVGElement: function(elementName, options) {
    const svgNamespace = "http://www.w3.org/2000/svg";
    const element = document.createElementNS(svgNamespace, elementName);

    if (typeof options !== "undefined") {
      if (options.class) {
        options.class.split(" ").forEach(name => {
          this.addClass(element, name);
        });
      }

      if (options.attributes) {
        Object.keys(options.attributes).forEach(k => {
          element.setAttribute(k, options.attributes[k]);
        });
      }

      if (options.text) {
        element.textContent = options.text.toString();
      }
    }

    return element;
  },

  appendElement: function(parent, el) {
    parent.insertBefore(el, null);
  },

  addEventListener: function(el, eventName, fn) {
    el.addEventListener(eventName, fn, false);
  },

  removeClass: function(el, className) {
    if (!this.hasClass(el, className)) {
      return;
    }

    if (el.classList && el.classList.remove) {
      el.classList.remove(className);
      return;
    }

    const classNameRegex = RegExp('\\b' + className + '\\b', "g");

    if (el instanceof SVGElement) {
      el.setAttribute("class", el.getAttribute("class").replace(classNameRegex, ""));
    } else {
      el.className = el.getAttribute("class").replace(classNameRegex, "");
    }
  },

  addClass: function(el, className) {
    if (el.classList && el.classList.add) {
      el.classList.add(className);
      return;
    }

    if (el instanceof SVGElement) {
      el.setAttribute("class", el.getAttribute("class") + " " + className);
    } else {
      el.className = el.getAttribute("class") + " " + className;
    }
  },

  hasClass: function(el, className) {
    if (el.classList && el.classList.contains) {
      return el.classList.contains(className);
    }

    const classNameRegex = RegExp('\\b' + className + '\\b', "g");

    if (el instanceof SVGElement) {
      return classNameRegex.test(el.getAttribute("class"));
    } else {
      return classNameRegex.test(el.className);
    }
  },

  toggleClass: function(el, className) {
    if (el.classList && el.classList.toggle) {
      el.classList.toggle(className);
      return;
    }

    if (this.hasClass(el, className)) {
      this.removeClass(el, className);
    } else {
      this.addClass(el, className);
    }
  },

  unique: function(ary) {
    let unique = [];
    ary.forEach(el => {
      if (unique.indexOf(el) < 0) {
        unique.push(el);
      }
    });
    return unique;
  }
};
