(function (Pryv) {
  if (!Pryv) {
    console.warn('Bypass Pryv auth: Cannot find Pryv');
    return;
  }

  var currentAuthSetup = Pryv.Auth.setup;

  // return parameters from url
  var params = function () {
    var query_string = {};
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
      var pair = vars[i].split("=");
      if (typeof query_string[pair[0]] === "undefined") {
        query_string[pair[0]] = pair[1];
      } else if (typeof query_string[pair[0]] === "string") {
        var arr = [ query_string[pair[0]], pair[1] ];
        query_string[pair[0]] = arr;
      } else {
        query_string[pair[0]].push(pair[1]);
      }
    }
    return query_string;
  } ();

  var checkValidCredential = function (connection, cb) {
    connection.accessInfo(function (error, result) {
      if (!error && result.type && result.type === 'personal') {
        cb(null);
      } else {
        cb(error);
      }
    });
  };
  var createAppAccess = function (connection, settings, cb) {
    var payload = {name: settings.requestingAppId, type: 'app', permissions: settings.requestedPermissions};
    connection.request('POST', '/accesses', function (error, result) {
      if (error) {
        return cb(error);
      } else {
        return cb(null, new Pryv.Connection(params.username, result.access.token, {domain: params.domain}));
      }
    }, payload);
  };
  var deleteAndCreateAppAccess = function (connection, settings, toDeleteAccess, cb) {
    connection.accesses.delete(toDeleteAccess.id, function (error) {
      if (error) {
        cb(error)
      } else {
        createAppAccess(connection, settings, cb);
      }
    })
  };
  var getOrCreateAppAccess = function (connection, settings, cb) {
    if (!settings.requestedPermissions || !settings.requestingAppId) {
      console.warn('Cannot find requestedPermissions or requestingAppId');
      return cb(true);
    }
    connection.request('POST', '/accesses/check-app', function (error, result) {
      if (error && !result) {
        cb(error);
      } else if (result.matchingAccess) {
        cb(null, new Pryv.Connection(params.username, result.matchingAccess.token, {domain: params.domain}));
      } else if (result.mismatchingAccess)  {
        settings.requestedPermissions = result.checkedPermissions;
        deleteAndCreateAppAccess(connection, settings, result.mismatchingAccess, cb);
      } else if (result.checkedPermissions) {
        settings.requestedPermissions = result.checkedPermissions;
        createAppAccess(connection, settings, cb);
      } else {
        console.warn('Error checking app access');
        cb(true);
      }
    }, {requestingAppId: settings.requestingAppId, requestedPermissions: settings.requestedPermissions});
  };

  var createButton = function (buttonID) {
    var buttonHtml = '<div id="pryv-access-btn" class="pryv-access-btn-signin"><a class="pryv-access-btn pryv-access-btn-pryv-access-color" href="#"><span class="logoSignin">Y</span></a><a class="pryv-access-btn pryv-access-btn-pryv-access-color" href="' + params.returnUrl + '"><span>Return</span></a></div>'

    var element = document.getElementById(buttonID);
    if (element) {
      element.innerHTML = buttonHtml;
    }
  };


  if (params.username && params.auth && params.returnUrl && params.domain) {
    Pryv.Auth.setup = function (settings) {
      var connection = new Pryv.Connection(params.username, params.auth, {domain: params.domain});
      checkValidCredential(connection, function (error) {
        if (error) {
          if (error.message) {
            console.warn(error.message);
          }
          currentAuthSetup.call(Pryv.Auth, settings);
        } else {
          getOrCreateAppAccess(connection, settings, function (error, appConnection) {
            if (error) {
              if (error.message) {
                console.warn(error.message);
              }
              currentAuthSetup.call(Pryv.Auth, settings);
            } else {
              createButton(settings.spanButtonID);
              if (settings.callbacks && settings.callbacks.signedIn && typeof(settings.callbacks.signedIn) === 'function') {
                settings.callbacks.signedIn(appConnection);
              }if (settings.callbacks && settings.callbacks.accepted && typeof(settings.callbacks.accepted) === 'function') {
                settings.callbacks.accepted(appConnection.username, appConnection.auth, appConnection.lang);
              }
            }
          });
        }
      });

    }
  }
})(pryv);