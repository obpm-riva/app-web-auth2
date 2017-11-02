/* global require */

var $ = require('jquery');
var cookie = require('js-cookie');
var methods = require('./methods');
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
    managePasswordResetView(Settings);
    manageRegistrationView(Settings);
  });
});

/**
 * Gets credential in cookies, updates username/e-mail and password fields,
 * changes the page title with serviceInfo.name
 * @param Settings {Object}
 */
function loadInfo (Settings) {
  var $usernameField = $('#loginUsernameOrEmail');
  var $passwordField = $('#loginPassword');
  var $pageTitle = $('title');

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
  var $cancelButton = $('#cancelButton');
  var $loginForm = $('#loginForm');
  var $registerButton = $('#loginFormRegister');
  var $resetButton = $('#loginFormReset');

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
    $('#registerContainer').show();
  });

  $resetButton.click(function() {
    $('#loginContainer').hide();
    $('#resetContainer').show();
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
      var $permissionsAccept = $('#permissionsAccept');
      var $permissionsReject = $('#permissionsReject');

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
function manageRegistrationView (Settings) {
  var reg = Settings.info.register;
  var appId = getURLParameter('requestingAppId');
  var lang = getURLParameter('lang');
  
  var terms = $('#termsLink');
  var support = $('#supportLink');
  terms.attr('href', Settings.info.terms);
  support.attr('href', Settings.info.support);
  
  register.retrieveHostings(reg);
  $('#registerForm').on('submit', function(e) {
    e.preventDefault();
    register.requestRegisterUser(reg, appId, lang);
  });
  $('#alreadyUser').click(function() {
    $('#registerContainer').hide();
    $('#loginContainer').show();
  });
}

/**
 * Manages password reset
 */
function managePasswordResetView (Settings) {
  var $resetForm = $('#resetForm');
  var $changePass = $('#setPass');
  var resetToken = getURLParameter('resetToken');
  var domain = Settings.info.register.replace('https://reg.', '');

  $resetForm.on('submit', function(e) {
    e.preventDefault();
    reset.requestResetPassword(domain);
  });
  $changePass.on('submit', function(e) {
    e.preventDefault();
    reset.setPassword(domain, resetToken);
  });
  if (resetToken) {
    $resetForm.hide();
    $changePass.show();
  } else {
    $resetForm.show();
    $changePass.hide();
  }
  $('#goToLogin').click(function() {
    $('#resetContainer').hide();
    $('#loginContainer').show();
  });
}

function getURLParameter (name) {
  return decodeURIComponent((new RegExp(name + '=' + '(.+?)(&|$)')
    .exec(location.search)||['',''])[1]);
}