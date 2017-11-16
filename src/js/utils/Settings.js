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


SettingsConstructor.prototype.setGoal = function (goal) {
  const goals = ['access', 'register', 'signinhub', 'resetPassword'];
  if (goals.indexOf(goal) < 0) {
    throw new Error('goal must be one of ' + JSON.stringify(goals) + ', instead of \`' + goal + '\`');
  }
  this.goal = goal;
};

SettingsConstructor.prototype.isAccess = function () {
  return this.goal === 'access';
};

SettingsConstructor.prototype.isRegisterStandalone = function () {
  return this.goal === 'register';
};

SettingsConstructor.prototype.isSigninhub = function () {
  return this.goal === 'signinhub';
};

SettingsConstructor.prototype.isResetPasswordStandalone = function () {
  return this.goal === 'resetPassword';
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
 * get the api URL
 * replaces the '{username}' in the api URL from serviceInfo by given username
 * @param username  {String}
 */
SettingsConstructor.prototype.getApiURL = function (username) {
  return this.info.api.replace('{username}', username);
};

/**
 * Returns the service infos URL by: by retrieving the domain from:
 * 1) Looking for it in the query parameters
 * 2) Building it from the hostname found in the hostname (Production)
 * 3) If it is `rec.la`, fetches the domain from the root level path (Development)
 *
 * @returns {String}
 */
SettingsConstructor.computeServiceInfoURL = function() {

  var serviceInfo = pryv.utility.urls.parseClientURL().parseQuery().serviceInfo;
  if(serviceInfo) {
    console.log('Service info from url param:');
  } else if(window.pryvServiceInfo) {
    serviceInfo = window.pryvServiceInfo;
    console.log('Service info from window var:');
  } else {
    var domain = document.location.hostname.substr(document.location.hostname.indexOf('.') + 1);
    if(domain === 'rec.la') {
      domain = pryv.utility.urls.parseClientURL().path.split('/')[1];
      console.log('Service info built from 1st path object (domain), rec.la dev mode:');
    } else if (domain === 'github.io') {
      domain = pryv.utility.urls.parseClientURL().path.split('/')[2];
      console.log('Service info built from 2nd path object (domain), direct access from gh pages:');
    } else {
      console.log('Service info from hostname:');
    }
    serviceInfo = 'https://reg.' + domain + '/service/infos';
  }
  console.log(serviceInfo);
  return serviceInfo;
};

module.exports = SettingsConstructor;