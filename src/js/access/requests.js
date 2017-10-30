/* global module, require */

var request = require('superagent');

var requests = {};

// TODO: Check if all these functions make sense here
// or should be replaced with already implemented js-lib functions

/**
 * GET request on serviceInfo URL given in the URL parameters,
 * gets the object containing all needed information about the service requesting the access
 * @param Settings {Object}
 * @param callback {Function}
 */
requests.getServiceInfo = function (Settings, callback) {
  Settings.utils.printInfo(Settings.strs.loadingServiceInfo);

  request
    .get(Settings.params.serviceInfo)
    .end(function (err, res) {
      if (err) { return callback(err, Settings); }
      Settings.addInfo(res.body);
      callback(null, Settings);
    });
};

/**
 * GET request on the poll URL given in the URL parameters;
 * gets the information about the requested access
 * @param Settings {Object}
 * @param callback {Object}
 */
requests.getAccessInfoFromRegister = function (Settings, callback) {
  Settings.utils.printInfo(Settings.strs.loadingSettings);

  // TODO delete this var when the Pryv Button has been updated                  <-------- !
  // From here ------------
  Settings.params.poll = Settings.info.access + '/' + Settings.params.key;
  // To here --------------

  request
    .get(Settings.params.poll)
    .end(function (err, res) {
      if (err) { return callback(err, Settings); }
      Settings.addAccess(res.body);
      callback(null, Settings);
    });
};

/**
 * GET request on the register URL given in URL parameters - endpoint: "/{e-mail}/uid",
 * only if the provided credentials contain an e-mail
 * @param Settings    {Object}
 * @param credentials {Object}
 * @param callback    {Function}
 */
requests.getUidIfEmail = function (Settings, credentials, callback) {
  if (credentials.usernameOrEmail.search('@') > 0) {
    Settings.utils.printInfo(Settings.strs.loginWithEmail);

    request
      .get(Settings.info.register + '/' + credentials.usernameOrEmail + '/uid')
      .end(function (err, res) {
        if (err) { return callback(err, Settings); }
        console.log(Settings.strs.uidWithMail
          .replace('{mail}', '\"' + credentials.usernameOrEmail + '\"')
          .replace('{username}', '\"' + res.body.uid + '\"'));
        callback(null, Settings, { uid: res.body.uid, password: credentials.password });
      });
  } else {
    Settings.utils.printInfo(Settings.strs.loginWithUsername);
    callback(null, Settings, { uid: credentials.usernameOrEmail, password: credentials.password });
  }
};

/**
 * POST request on the API URL (from service info) - endpoint: "/auth/login",
 * authenticates on Pryv using the provided credentials
 * @param Settings    {Object}
 * @param credentials {Object}
 * @param callback    {Function}
 */
requests.authenticateWithCredentials = function (Settings, credentials, callback) {
  Settings.updateApiURL(credentials.uid);

  request
    .post(Settings.info.api + 'auth/login')
    .send({ username: credentials.uid,
      password: credentials.password,
      appId: Settings.access.requestingAppId })
    .end(function (err, res) {
      if (err) { return callback(err, Settings); }
      Settings.addAuth({ username: credentials.uid, token: res.body.token });
      callback(null, Settings);
    });
};

/**
 * POST request on the API URL (from service info) - endpoint: "/accesses/check-app",
 * checks the app access and permissions
 * @param Settings {Object}
 * @param callback {Function}
 */
requests.checkAppAccess = function (Settings, callback) {
  Settings.utils.printInfo(Settings.strs.checkingAppAccess);

  request
    .post(Settings.info.api + 'accesses/check-app')
    .send({ requestingAppId: Settings.access.requestingAppId,
      requestedPermissions: Settings.access.requestedPermissions })
    .set({ 'Authorization': Settings.auth.token })
    .end(function (err, res) {
      if (err) { return callback(err, Settings); }
      Settings.addCheck(res.body);
      callback(null, Settings);
    });
};

/**
 * POST request on the API URL (from service info) - endpoint: "/accesses?auth={token}",
 * creates an access of type 'app' for the requesting app with the chosen permissions
 * @param Settings {Object}
 * @param accesses {Object}
 * @param callback {Function}
 */
requests.createAccess = function (Settings, callback) {
  Settings.utils.printInfo(Settings.strs.creatingAccess
    .replace('{appId}', Settings.access.requestingAppId));

  request
    .post(Settings.info.api + 'accesses?auth=' + Settings.auth.token)
    .send({
      type: 'app',
      name: Settings.access.requestingAppId,
      permissions: Settings.check.checkedPermissions
    })
    .end(function (err, res) {
      if (err) { return callback(err); }
      Settings.appToken = res.body.access.token;
      callback(null, Settings);
    });
};

/**
 * POST request on the poll URL given in the URL parameters,
 * sends the state of the authentication requested to the requesting app
 * @param Settings {Object}
 * @param data     {Object}
 * @param message  {Object | String}
 * @param callback {Function}
 */
requests.sendState = function (Settings, data, message, callback) {
  Settings.utils.printInfo(Settings.strs.sendingState);

  request
    .post(Settings.params.poll)
    .send(data.state)
    .end(function (err) {
      if (err && err.response.body.status !== 'REFUSED') { return callback(err, Settings); }
      callback(null, Settings, data.stateTitle, message);
    });
};

module.exports = requests;