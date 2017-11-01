/* global require */

var $ = require('jquery'),
  cookie = require('js-cookie'),
  methods = require('./methods');
  
var register = require('../account/register');
var reset = require('../account/reset');

/**
 * Initialize login form
 */
$(window).ready(function () {
  var $loginForm = $('#loginForm');
  $loginForm.submit(function () { return false; });
  $('#registerContainer').hide();
  $('#resetContainer').hide();
  
  methods.buildSettings(function (err, Settings) {
    if (err) {
      return methods.manageState(Settings, 'ERROR', err);
    }
    loadInfo(Settings);
    manageStatus(Settings);
  });
});

/**
 * Gets credential in cookies, updates username/e-mail and password fields,
 * changes the page title with serviceInfo.name
 * @param Settings {Object}
 */
function loadInfo (Settings) {
  var $usernameField = $('#loginUsernameOrEmail'),
    $passwordField = $('#loginPassword'),
    $pageTitle = $('title');

  if (cookie.get('credentials')) {
    var credentials = JSON.parse(cookie.get('credentials'));
    $usernameField.val(credentials.usernameOrEmail);
    $passwordField.val(credentials.password);
  }
  $pageTitle.text(Settings.info.name);
}

/**
 * Manages the status switches
 * @param Settings {Object}
 */
function manageStatus(Settings) {
  Settings.utils.$blockContainer.hide();

  switch(Settings.access.status) {
    case 'NEED_SIGNIN':
      Settings.utils.toggleMainView('show');
      manageLoginView(Settings);
      break;
    case 'ACCEPTED':
      Settings.addAuth({ username: Settings.access.username,
        token: Settings.access.token });
      methods.manageState(Settings, 'ACCEPTED', Settings.strs.closing);
      break;
    case 'ERROR':
      methods.manageState(Settings, 'ERROR', Settings.strs.genericError);
      break;
  }
}

/**
 * Manages inputs on the signIn button, the cancel button, the username/e-mail and password fields
 * @param Settings
 */
function manageLoginView (Settings) {
  var $cancelButton = $('#cancelButton'),
    $loginForm = $('#loginForm'),
    $registerButton = $('#loginFormRegister'),
    $resetButton = $('#loginFormReset');

  $loginForm.submit(function () {
    if (!Settings.logIn) {
      Settings.logIn = true;
      methods.loginToPryv(Settings, function (err, Settings) {
        if (err) { return Settings.utils.printError(err); }
        managePostLogin(Settings);
      });
    }
    return false;
  });

  $cancelButton.click(function () {
    methods.manageState(Settings, 'REFUSED', Settings.strs.accessRefused);
  });

  $registerButton.click(function() {
    $('#loginContainer').hide();
    manageRegistrationView();
  });

  $resetButton.click(function() {
    $('#loginContainer').hide();
    managePasswordResetView();
  });
}

/**
 * Manages permissions on successful login
 * @param Settings {Object}
 */
function managePostLogin (Settings) {
  if (Settings.check.accessExists || !Settings.check.checkedPermissions) {
    methods.manageState(Settings, 'ACCEPTED', Settings.strs.closing);
  } else {
    Settings.utils.permissionsState(false);

    managePermissionsView(Settings, function () {
      var $permissionsAccept = $('#permissionsAccept'),
        $permissionsReject = $('#permissionsReject');

      setTimeout(function () { Settings.utils.permissionsState(false); }, 500);
      $permissionsAccept.click(function () {
        methods.manageAcceptedState(Settings, function (err) {
          if (err) { methods.manageState(Settings, 'ERROR', err); }
          else { methods.manageState(Settings, 'ACCEPTED', Settings.strs.closing); }
        });
      });
      $permissionsReject.click(function () {
        methods.manageState(Settings, 'REFUSED', Settings.strs.accessRefused);
      });
    });
  }
}

/**
 * Manages permissions view
 * @param Settings {Object}
 * @param callback {Function}
 */
function managePermissionsView (Settings, callback) {
  Settings.utils.printInfo(Settings.strs.loadingPermissions);
  Settings.utils.permissionsState(true);
  Settings.utils.permissionsView(Settings);
  Settings.check.checkedPermissions.forEach(function (elem, i, array) {
    setTimeout(function () {
      Settings.utils.addPermission(Settings, elem);
      if (i === array.length - 1) { return callback(); }
    }, i * 1000);
  });
}

/**
 * Manages user registration
 */
function manageRegistrationView () {
  $('#registerContainer').show();
  register.retrieveHostings();
  $('#registerForm').on('submit', function(e) {
    register.requestRegisterUser(e, function(err, res) {
      if(err) {
        $('#error').text(err).show();
        $('#registerForm').find('input[type=submit]').prop('disabled', false);
      } else {
        $('#loginUsernameOrEmail').val(res.username);
        $('#loginPassword').val(res.password);
        $('#registerContainer').hide();
        $('#loginContainer').show();
      }
    });
  });
  $('#alreadyUser').click(function() {
    $('#registerContainer').hide();
    $('#loginContainer').show();
  });
}

/**
 * Manages password reset
 */
function managePasswordResetView () {
  $('#resetContainer').show();
  var $resetForm = $('#resetForm');
  var $changePass = $('#setPass');
  var resetToken = decodeURIComponent((new RegExp('resetToken=' + '(.+?)(&|$)')
    .exec(location.search)||['',''])[1]);
  
  $resetForm.on('submit', reset.requestResetPassword);
  $changePass.on('submit', reset.setPassword);
  if (resetToken) {
    $resetForm.hide();
    $changePass.show();
  } else {
    $resetForm.show();
    $changePass.hide();
  }
}
