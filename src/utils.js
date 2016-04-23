export default {
  flatten: function(ary) {
    return ary.reduce((a, b) => a.concat(b));
  },

  flatMap: function(ary, lambda) {
    return Array.prototype.concat.apply([], ary.map(lambda));
  },

  createElement: function(elementName, options) {
    const element = document.createElement(elementName);

    if (typeof options != "undefined") {
      if (options.class) {
        element.className = options.class;
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
    el.classList.remove(className);
  },

  addClass: function(el, className) {
    el.classList.add(className);
  },

  hasClass: function(el, className) {
    return el.classList.contains(className);
  },

  toggleClass: function(el, className) {
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
