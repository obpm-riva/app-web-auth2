// Generated by CoffeeScript 1.3.3
var URL, XMLHttpRequest, html, http, raise;

html = require("../node_modules/zombie/node_modules/jsdom").dom.level3.html;

http = require("http");

URL = require("url");

raise = require("../node_modules/zombie/lib/zombie/scripts").raise;

html.SECURITY_ERR = 18;

html.NETWORK_ERR = 19;

html.ABORT_ERR = 20;

XMLHttpRequest = function(window) {
  var reset, stateChanged,
    _this = this;
  stateChanged = function(state) {
    _this.__defineGetter__("readyState", function() {
      return state;
    });
    if (_this.onreadystatechange) {
      return window.browser._eventloop.perform(function(done) {
        return process.nextTick(function() {
          try {
            return _this.onreadystatechange.call(_this);
          } catch (error) {
            return raise({
              element: window.document,
              from: __filename,
              scope: "XHR",
              error: error
            });
          } finally {
            done();
          }
        });
      });
    }
  };
  reset = function() {
    _this.__defineGetter__("readyState", function() {
      return 0;
    });
    _this.__defineGetter__("status", function() {
      return 0;
    });
    _this.__defineGetter__("statusText", function() {});
    _this.abort = function() {};
    _this.setRequestHeader = _this.send = function() {
      throw new html.DOMException(html.INVALID_STATE_ERR, "Invalid state");
    };
    _this.getResponseHeader = _this.getAllResponseHeaders = function() {};
    return _this.open = function(method, url, async, user, password) {
      var aborted, headers, _ref, _ref1;
      method = method.toUpperCase();
      if (/^(CONNECT|TRACE|TRACK)$/.test(method)) {
        throw new html.DOMException(html.SECURITY_ERR, "Unsupported HTTP method");
      }
      if (!/^(DELETE|GET|HEAD|OPTIONS|POST|PUT)$/.test(method)) {
        throw new html.DOMException(html.SYNTAX_ERR, "Unsupported HTTP method");
      }
      url = URL.parse(URL.resolve(window.location.href, url));
      url.hostname || (url.hostname = window.location.hostname);
      url.host = url.port ? "" + url.hostname + ":" + url.port : url.hostname;
      url.hash = null;
      if (url.host !== window.location.host && false) {
        throw new html.DOMException(html.SECURITY_ERR, "Cannot make request to different domain");
      }
      if ((_ref = url.protocol) !== "http:" && _ref !== "https:") {
        throw new html.DOMException(html.NOT_SUPPORTED_ERR, "Only HTTP/S protocol supported");
      }
      if (url.auth) {
        _ref1 = url.auth.split(":"), user = _ref1[0], password = _ref1[1];
      }
      this._error = null;
      aborted = false;
      this.abort = function() {
        aborted = true;
        return reset();
      };
      headers = {};
      this.setRequestHeader = function(header, value) {
        return headers[header.toString().toLowerCase()] = value.toString();
      };
      this.send = function(data) {
        var _this = this;
        this.abort = function() {
          aborted = true;
          this._error = new html.DOMException(html.ABORT_ERR, "Request aborted");
          stateChanged(4);
          return reset();
        };
        return window.browser.resources.request(method, url, data, headers, function(error, response) {
          if (error) {
            _this._error = new html.DOMException(html.NETWORK_ERR, error.message);
            stateChanged(4);
            return reset();
          } else {
            _this.getResponseHeader = function(header) {
              return response.headers[header.toLowerCase()];
            };
            _this.getAllResponseHeaders = function() {
              var header, headerStrings, value;
              headerStrings = (function() {
                var _ref2, _results;
                _ref2 = response.headers;
                _results = [];
                for (header in _ref2) {
                  value = _ref2[header];
                  _results.push("" + header + ": " + value);
                }
                return _results;
              })();
              return headerStrings.join("\n");
            };
            _this.__defineGetter__("status", function() {
              return response.statusCode;
            });
            _this.__defineGetter__("statusText", function() {
              return response.statusText;
            });
            stateChanged(2);
            if (!aborted) {
              _this.__defineGetter__("responseText", function() {
                return response.body;
              });
              _this.__defineGetter__("responseXML", function() {});
              return stateChanged(4);
            }
          }
        });
      };
      this.open = function(method, url, async, user, password) {
        this.abort();
        return this.open(method, url, async, user, password);
      };
      return stateChanged(1);
    };
  };
  reset();
};

XMLHttpRequest.UNSENT = 0;

XMLHttpRequest.OPENED = 1;

XMLHttpRequest.HEADERS_RECEIVED = 2;

XMLHttpRequest.LOADING = 3;

XMLHttpRequest.DONE = 4;

exports.use = function() {
  var extend;
  extend = function(window) {
    return window.XMLHttpRequest = function() {
      return XMLHttpRequest.call(this, window);
    };
  };
  return {
    extend: extend
  };
};