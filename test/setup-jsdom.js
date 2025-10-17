const { JSDOM } = require("jsdom");

// Setup the jsdom environment
// @see https://github.com/facebook/react/issues/5046
if (!global.window) {
  const dom = new JSDOM(
    "<!doctype html><html><body><div id='root'></div></body></html>",
    {
      url: "http://localhost",
      pretendToBeVisual: true,
    }
  );

  global.window = dom.window;
  global.document = dom.window.document;

  // Copy all DOM-related properties from window to global
  Object.keys(dom.window).forEach(property => {
    if (typeof global[property] === "undefined") {
      try {
        global[property] = dom.window[property];
      } catch (e) {
        // Some properties like navigator are read-only on global
      }
    }
  });

  // Add requestAnimationFrame and cancelAnimationFrame polyfills
  let rafId = 0;
  const rafCallbacks = new Map();

  global.requestAnimationFrame = function(callback) {
    const id = ++rafId;
    rafCallbacks.set(id, callback);
    process.nextTick(() => {
      const cb = rafCallbacks.get(id);
      if (cb) {
        rafCallbacks.delete(id);
        cb(Date.now());
      }
    });
    return id;
  };

  global.cancelAnimationFrame = function(id) {
    rafCallbacks.delete(id);
  };

  // Copy these to window as well
  global.window.requestAnimationFrame = global.requestAnimationFrame;
  global.window.cancelAnimationFrame = global.cancelAnimationFrame;

  // Set up MessageChannel for React's scheduler
  if (!global.MessageChannel) {
    global.MessageChannel = class MessageChannel {
      constructor() {
        this.port1 = {
          onmessage: null,
          postMessage: message => {
            if (this.port2.onmessage) {
              process.nextTick(() => this.port2.onmessage({ data: message }));
            }
          },
        };
        this.port2 = {
          onmessage: null,
          postMessage: message => {
            if (this.port1.onmessage) {
              process.nextTick(() => this.port1.onmessage({ data: message }));
            }
          },
        };
      }
    };
  }
}

// atob
global.atob = require("atob");

// HTML debugging helper
global.d = function d(node) {
  console.log(require("html").prettyPrint(node.outerHTML, { indent_size: 2 }));
};
