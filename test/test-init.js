process.env.NODE_ENV = 'test';
// Dependencies
var server = require('../../../server');
var config = require('../../../utils/config');



var Browser = require('zombie');
var XHR = require('./patch-zombie-xhr');


exports.config = config;
exports.newPatchedBrowser = function(settings) {
  var browser = new Browser(settings);
    browser._xhr = XHR.use(browser._cache);
  return browser;
};
