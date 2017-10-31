/* global module, require */

var cookie = require('js-cookie'),
  async = require('async'),
  pryv = require('pryv'),
  $ = require('jquery');

var requests = require('./requests'),
  Locale = require('../utils/Locale'),
  Settings = require('../utils/Settings');

var methods = {};

/**
 * Creates the Settings object,
 * adds translated messages, URL parameters, service info and access info
 * @param callback {Function}
 */
methods.buildSettings = function (callback) {
  var settings = new Settings('login');

  Locale.translate('login', function (err, strs) {
    if (err) {
      return callback(err, settings);
    }
    settings.addStrs(strs);
    settings.utils.genericError = settings.strs.genericError;

    // TODO change the parameters given by the Pryv Button in Lib-Javascript to fit this format
    // Settings.addParams({
    //   poll: pryv.utility.urls.parseClientURL().parseQuery().poll,
    //   lang: pryv.utility.urls.parseClientURL().parseQuery().lang,
    //   serviceInfo: pryv.utility.urls.parseClientURL().parseQuery().serviceInfo
    //   returnURL: pryv.utility.urls.parseClientURL().parseQuery().returnURL
    // });

    // TODO delete this var when the Pryv Button has been updated                      <-------- !
    // From here ------------
    var serviceInfo = Settings.retrieveServiceInfo();
    settings.addParams({
      poll: 'null',
      serviceInfo: serviceInfo,
      key: pryv.utility.urls.parseClientURL().parseQuery().key,
      lang: pryv.utility.urls.parseClientURL().parseQuery().lang,
      returnURL: pryv.utility.urls.parseClientURL().parseQuery().returnURL
    });
    // To here --------------

    async.waterfall([
      function (stepDone) {
        stepDone(null, settings);
      },
      parseUrlParams,
      requests.getServiceInfo,
      requests.getAccessInfoFromRegister
    ], function (err, settings) {
      if (err) {
        return callback(err, settings);
      }
      callback(null, settings);
    });
  });
};

/**
 * Login using the content of the username/e-mail and password fields,
 * sets credentials in cookies for 1 days
 * @param Settings {Object}
 * @param callback {Function}
 */
methods.loginToPryv = function (settings, callback) {
  var $usernameOrEmail = $('#loginUsernameOrEmail'),
    $password = $('#loginPassword');

  if (!$usernameOrEmail.val() && !$password.val()) {
    return callback(settings.strs.missingUsernameAndPassword);
  } else if (!$usernameOrEmail.val() && $password.val()) {
    return callback(settings.strs.missingUsername);
  } else if ($usernameOrEmail.val() && !$password.val()) {
    return callback(settings.strs.missingPassword);
  }
  var credentials = {
    password: $password.val(),
    usernameOrEmail: $usernameOrEmail.val().trim().toLowerCase()
  };
  cookie.set('credentials', credentials, {expires: 1, path: settings.utils.url});
  async.waterfall([
    function (stepDone) {
      stepDone(null, settings, credentials);
    },
    requests.getUidIfEmail,
    requests.authenticateWithCredentials,
    requests.checkAppAccess
  ], function (err, settings) {
    callback(err, settings);
  });
};

/**
 * Creates an access of type 'app' with the requested permissions
 * @param Settings {Object}
 * @param callback {Function}
 */
methods.manageAcceptedState = function (settings, callback) {
  requests.createAccess(settings, callback);
};

/**
 * Manages the status of the current authentication request
 * @param Settings {Object}
 * @param status   {String}
 * @param message  {String || Object}
 */
methods.manageState = function (settings, status, message) {
  var data = {state: {}, stateTitle: ''};

  switch (status) {
    case 'ACCEPTED':
      data = {
        stateTitle: settings.strs.accessGranted.replace('{username}', settings.auth.username),
        state: {
          status: status,
          username: settings.auth.username,
          token: settings.appToken,
          lang: settings.params.lang
        }
      };
      break;
    case 'REFUSED':
      data = {
        stateTitle: settings.strs.accessCanceled,
        state: {
          status: status,
          reasonId: 'REFUSED_BY_USER',
          message: message
        }
      };
      break;
    case 'ERROR':
      if (message.response) {
        message = message.response.body;
      }
      if (message.error) {
        message = message.error;
      }
      data = {
        stateTitle: settings.strs.genericError,
        state: {
          status: 'ERROR',
          id: message.id || 'INTERNAL_ERROR',
          message: message.message || '',
          detail: message.detail || ''
        }
      };
      break;
  }

  if (status === 'ACCEPTED' && !data.state.token) {
    methods.manageAcceptedState(settings, function (err) {
      if (err) {
        return methods.manageState(settings, 'ERROR', err);
      }
      data.state.token = settings.appToken;
      requests.sendState(settings, data, message, endPopUp);
    });
  } else {
    requests.sendState(settings, data, message, endPopUp);
  }
};

module.exports = methods;

/**
 * Parsing of the URL parameters
 * @param Settings {Object}
 * @param callback {Function}
 * @returns        {*} if error
 */
function parseUrlParams(settings, callback) {
  if (!settings.params.poll) {
    return callback(settings.strs.missingPoll, settings);
  } else if (!settings.params.serviceInfo) {
    return callback(settings.strs.missingServiceInfo, settings);
  } else if (!settings.params.lang) {
    return callback(settings.strs.missingLang, settings);
  }

  if (settings.params.returnURL) {
    try {
      settings.params.returnURL = decodeURIComponent(settings.params.returnURL);
    }
    catch (err) {
      callback(err, settings);
    }
  }
  callback(null, settings);
}

/**
 * Changes the current view depending on the success or the failure of the authentication process,
 * closes or goes back to previous URL
 * @param err        {Object}
 * @param Settings   {Object}
 * @param stateTitle {String}
 * @param message    {Object | String}
 */
function endPopUp(err, settings, stateTitle, message) {

  if (err) {
    settings.utils.loaderView(settings.strs.genericError, err);
  }
  else {
    settings.utils.loaderView(stateTitle, message);
  }

  setTimeout(function () {
    if (settings.params.returnURL &&
      settings.params.returnURL !== 'false') {
      location.href = settings.params.returnURL +
        '?prYvstatus=ACCEPTED&prYvusername=' + settings.auth.username +
        '&prYvtoken=' + settings.appToken +
        '&prYvlang=' + settings.params.lang +
        '&prYvkey=' + settings.params.key;
    } else {
      window.close();
    }
  }, 2000);
}