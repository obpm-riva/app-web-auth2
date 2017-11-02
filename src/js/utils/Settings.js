/* global module, require */

var UtilityConstructor = require('./Utility');
var pryv = require('pryv');

/**
 * creates a object containing all needed information's and methods to manage them
 * @constructor  Settings
 */
var SettingsConstructor = function (page) {
  this.utils = new UtilityConstructor(page);
  this.appToken = '';
  this.params = {};
  this.access = {};
  this.check = {};
  this.auth = {};
  this.info = {};
  this.strs = {};
  this.logIn = false;

  this.utils.toggleMainView('hide');
};

SettingsConstructor.prototype.addParams = function (params) {
  this.params = params;
};

SettingsConstructor.prototype.addAccess = function (access) {
  this.access = access;
};

SettingsConstructor.prototype.addCheck = function (check) {
  this.check = check;
};

SettingsConstructor.prototype.addAuth = function (auth) {
  this.auth = auth;
};

SettingsConstructor.prototype.addInfo = function (info) {
  this.info = info;
};

SettingsConstructor.prototype.addStrs = function (strs) {
  this.strs = strs;
};

/**
 * adds the username to the Settings object
 * replaces the '{username}' in the api URL from serviceInfo by given username
 * @param username  {String}
 */
SettingsConstructor.prototype.updateApiURL = function (username) {
  this.info.api = this.info.api.replace('{username}', username);
};

SettingsConstructor.retrieveServiceInfo = function() {
  var serviceInfo = pryv.utility.urls.parseClientURL().parseQuery().serviceInfo;
  if(serviceInfo) {
    console.log('Service info from url param:');
  } else if(window.pryvServiceInfo) {
    serviceInfo = window.pryvServiceInfo;
    console.log('Service info from window var:');
  } else {
    var domain = document.location.hostname.substr(document.location.hostname.indexOf('.') + 1);
    if(domain === 'rec.la') {
      domain = pryv.utility.urls.parseClientURL().parseQuery().domain;
      console.log('Service info from url param (domain), rec.la dev mode:');
    } else {
      console.log('Service info from hostname:');
    }
    serviceInfo = 'https://reg.' + domain + '/service/infos';
  }
  console.log(serviceInfo);
  return serviceInfo;
};

module.exports = SettingsConstructor;