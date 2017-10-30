var $ = require('jquery'),
  pryv = require('pryv');

var getURLParameter = function (name) {
  return decodeURIComponent((new RegExp(name + '=' + '(.+?)(&|$)')
    .exec(location.search)||['',''])[1]);
};

var getEnvironment = function () {
  // TODO: Maybe use getURLParameter and parse
  // TODO: Also return api env
  var env = pryv.Auth.config.registerURL.host;
  env = env.substring(4);
  return env;
};

var requestResetPassword = function (e) {
  e.preventDefault();
  var resetForm = $('#resetForm');
  var username = resetForm.find('input[name=username]').val();
  if (username && username.length > 0) {
    resetForm.find('input[type=submit]').prop('disabled', true);
    $.post('https://' + username + '.' + getEnvironment() +
      '/account/request-password-reset', {appId: 'static-web'})
      .done(function () {
        $('#error').hide().empty();
        resetForm.hide();
        $('#requestSent').show();
        resetForm.find('input[type=submit]').prop('disabled', false);
      })
      .fail(function () {
        $('#error').text('Username unknown').show();
        resetForm.find('input[type=submit]').prop('disabled', false);
      });
  }
};

var setPassword = function (e) {
  e.preventDefault();
  var setPass = $('#setPass');
  var username = setPass.find('input[name=username]').val();
  var pass = setPass.find('input[name=password]').val();
  var rePass = setPass.find('input[name=rePassword]').val();
  if (username && username.length > 0 && pass && pass === rePass) {
    setPass.find('input[type=submit]').prop('disabled', true);
    $.post('https://' + username + '.' + getEnvironment() + '/account/reset-password',
      {newPassword: pass, appId: 'static-web', resetToken : getURLParameter('resetToken')})
      .done(function () {
        window.location.replace('https://' + username + '.' +
          getEnvironment() + '/#/SignIn');
      })
      .fail(function () {
        $('#error').text('Username unknown').show();
        setPass.find('input[type=submit]').prop('disabled', false);
      });
  }
};

$(document).ready(function(){
  var $resetForm = $('#resetForm');
  var $changePass = $('#setPass');
  var resetToken = getURLParameter('resetToken');
  $resetForm.on('submit', requestResetPassword);
  $changePass.on('submit', setPassword);
  if (resetToken) {
    $resetForm.hide();
    $changePass.show();
  } else {
    $resetForm.show();
    $changePass.hide();
  }
});