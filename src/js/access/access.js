/* global require */

var $ = require('jquery');
var cookie = require('js-cookie');
var methods = require('./methods');
var register = require('../account/register');
var reset = require('../account/reset');
var pryv = require('pryv');

const ACCESS_PAGE = 'access', 
      REGISTER_PAGE = 'register',
      SIGNIN_PAGE = 'signinhub',
      RESET_PASSWORD_PAGE = 'resetPassword';

/**
 * Initialize login form
 */
$(window).ready(function () {
  var $loginForm = $('#loginForm');
  $loginForm.submit(function () { return false; });
  $('#registerContainer').hide();
  $('#resetContainer').hide();

  var page = '';
  if(getURLParameter('standaloneRegister')) {
    page = REGISTER_PAGE;
  } else if (getURLParameter('standaloneReset')) {
    page = RESET_PASSWORD_PAGE;
  } else if (getURLParameter('standaloneSigninhub')) {
    page = SIGNIN_PAGE;
  } else {
    page = ACCESS_PAGE;
  }
  
  methods.buildSettings(page, function (err, Settings) {
    if (err) {
      return methods.manageState(Settings, 'ERROR', err);
    }
    
    // Oauth for IFTTT
    var oauthState = getURLParameter('oauthState');
    if (oauthState) {
      Settings.oauth = oauthState;
    }
    
    loadInfo(Settings);
    manageStatus(Settings);
    managePasswordResetView(Settings);
    manageRegistrationView(Settings);
  });
});

/**
 * Gets username in cookies, updates username/e-mail field,
 * changes the page title with serviceInfo.name
 * @param Settings {Object}
 */
function loadInfo (Settings) {
  var $usernameField = $('#loginUsernameOrEmail');
  var $pageTitle = $('title');
  
  var usernameOrEmail = cookie.get('usernameOrEmail');
  if (usernameOrEmail) {
    $usernameField.val(usernameOrEmail);
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
      methods.loginToPryv(Settings, function (err, Settings) {
        if (err) { 
          // Avoid this with a preliminary check in reg?
          if(err.toString().indexOf('Request has been terminated') !== -1) {
            return Settings.utils.printError('Unknown username');
          }
          return Settings.utils.printError(err);
        }
        Settings.logIn = true;
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
    $('#blockContainer').hide();
    $('#registerContainer').show();
  });

  $resetButton.click(function() {
    $('#loginContainer').hide();
    $('#blockContainer').hide();
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
 * Sets a randomly generated username, but makes a request to find
 *
 * @param field
 * @param register
 */
function generateValidUsername(field, registerUrl) {
  var username = generateUsername();

  // set the username upfront. Optimistic approach.
  field.val(username);

  register.checkUsername(username, {reg: registerUrl}, function (err, username) {
    if (err) {
      console.log('Error while verifying username validity', err);

      return;
    }

    if (! username) {
      generateValidUsername(field, registerUrl);
    }
  });

  function generateUsername() {
    var username = '';
    var dictionnary = "abcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 6; i++) {
      username += dictionnary.charAt(Math.floor(Math.random() * dictionnary.length));
    }
    return username
  }
}

/**
 * Manages user registration
 */
function manageRegistrationView (Settings) {
  var appId = getURLParameter('requestingAppId');
  var lang = getURLParameter('lang');
  
  var terms = $('#termsLink');
  var support = $('#supportLink');
  terms.attr('href', Settings.info.terms);
  support.attr('href', Settings.info.support);
  
  register.retrieveHostings(Settings.info.register);



  generateValidUsername($('#registerForm').find('input[name=username]'), Settings.info.register);
  //.val();

  $('#registerForm').on('submit', function(e) {
    e.preventDefault();
    register.requestRegisterUser(getURLParameter('returnURL'), appId, lang, Settings);
  });
  $('#alreadyUser').click(function() {
    $('#registerContainer').hide();
    $('#loginContainer').show();
  });
  if(getURLParameter('standaloneRegister')) {
    $('#registerContainer').show();
    $('#loginContainer').hide();
    $('#resetContainer').hide();
    $('#alreadyUser').hide();
  }
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
    reset.setPassword(getURLParameter('returnURL'), domain, resetToken, Settings);
  });
  if (resetToken) {
    $resetForm.hide();
    $changePass.show();
    $('#loginContainer').hide();
    $('#resetContainer').show();
  } else {
    $resetForm.show();
    $changePass.hide();
  }
  $('#goToLogin').click(function() {
    $('#resetContainer').hide();
    $('#loginContainer').show();
  });
  if(getURLParameter('standaloneReset')) {
    $('#resetContainer').show();
    $('#loginContainer').hide();
    $('#registerContainer').hide();
    $('#goToLogin').hide();
  }
}

function getURLParameter (name) {
  return decodeURIComponent((new RegExp(name + '=' + '(.+?)(&|$)')
    .exec(location.search)||['',''])[1]);
}
