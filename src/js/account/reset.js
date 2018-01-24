var $ = require('jquery');

module.exports.requestResetPassword = function (domain) {
  var resetForm = $('#resetForm');
  var username = resetForm.find('input[name=username]').val();
  if (username && username.length > 0) {
    resetForm.find('input[type=submit]').prop('disabled', true);
    $.post('https://' + username + '.' + domain +
      '/account/request-password-reset', {appId: 'static-web'})
      .done(function () {
        resetForm.get(0).reset();
        $('#passwordError').hide().empty();
        resetForm.hide();
        $('#requestSent').show();
        resetForm.find('input[type=submit]').prop('disabled', false);
      })
      .fail(function () {
        $('#passwordError').text('Unknown userID').show();
        resetForm.find('input[type=submit]').prop('disabled', false);
      });
  }
};

module.exports.setPassword = function (returnURL, domain, token, Settings) {
  var setPass = $('#setPass');
  var username = setPass.find('input[name=username]').val();
  var pass = setPass.find('input[name=password]').val();
  var rePass = setPass.find('input[name=rePassword]').val();
  if (username && username.length > 0 && pass && pass === rePass) {
    setPass.find('input[type=submit]').prop('disabled', true);
    $.post('https://' + username + '.' + domain + '/account/reset-password',
      {newPassword: pass, appId: 'static-web', resetToken : token})
      .done(function () {
        setPass.get(0).reset();
        $('#loginUsernameOrEmail').val(username);
        $('#loginPassword').val(pass);
        $('#resetContainer').hide();
        if (Settings.isResetPasswordStandalone()) {
          var redirect = returnURL || Settings.getApiURL(username);
          window.location.replace(redirect);
        } else {
          $('#loginContainer').show();
        }
      })
      .fail(function () {
        $('#passwordError').text('Unknown userID').show();
        setPass.find('input[type=submit]').prop('disabled', false);
      });
  }
};
