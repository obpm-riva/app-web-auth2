var $ = require('jquery');
var async = require('async');
var request = require('superagent');
/**
 * Make reset password request. Takes the username or email from the username form.
 *
 * @param domain
 */
module.exports.requestResetPassword = function (domain) {
  var resetForm = $('#resetForm');
  var username = resetForm.find('input[name=username]').val();
  if (username && username.length > 0) {

    resetForm.find('input[type=submit]').prop('disabled', true);

    async.series([
      function retrieveUsernameIfEmail (stepDone) {
        if (username.search('@') > 0) {
          request.get('https://reg.' + domain + '/' + username + '/uid')
            .end(function (err, res) {
              if (res.body.id === 'UNKNOWN_EMAIL') {
                $('#passwordError').text(res.body.message + ': ' + username).show();
                resetForm.find('input[type=submit]').prop('disabled', false);
                return stepDone(err);
              }
              username = res.body.uid;
              stepDone();
            });
        } else {
          stepDone();
        }
      },
      function requestPasswordReset (stepDone) {
        request.post('https://' + username + '.' + domain +
          '/account/request-password-reset', {appId: 'static-web'})
          .end(function (err) {
            if (err) {
              // if username is unknown - this returns a 404 as the DNS can't resolve
              $('#passwordError').text('Username unknown: ' + username).show();
              resetForm.find('input[type=submit]').prop('disabled', false);
              return stepDone(err);
            }
            resetForm.get(0).reset();
            $('#passwordError').hide().empty();
            resetForm.hide();
            $('#requestSent').show();
            resetForm.find('input[type=submit]').prop('disabled', false);
            return stepDone();
          })
      }
    ]);
  }
};

module.exports.setPassword = function (returnURL, domain, token, Settings) {
  var setPass = $('#setPass');
  var username = setPass.find('input[name=username]').val();
  var pass = setPass.find('input[name=password]').val();
  var rePass = setPass.find('input[name=rePassword]').val();

  if (pass && rePass && !(pass === rePass)) {
    $('#passwordError').text('Password does not match the confirm password.').show();
    return setPass.find('input[type=submit]').prop('disabled', false);
  }

  if (username && username.length > 0) {
    setPass.find('input[type=submit]').prop('disabled', true);

    async.series([
      function retrieveUsernameIfEmail (stepDone) {
        if (username.search('@') > 0) {
          request.get('https://reg.' + domain + '/' + username + '/uid')
            .end(function (err, res) {
              if (res.body.id === 'UNKNOWN_EMAIL') {
                $('#passwordError').text(res.body.message + ': ' + username).show();
                setPass.find('input[type=submit]').prop('disabled', false);
                return stepDone(err);
              }
              username = res.body.uid;
              stepDone();
            });
        } else {
          stepDone();
        }
      },
      function resetPassword (stepDone) {
        request.post('https://' + username + '.' + domain + '/account/reset-password')
          .send({newPassword: pass, appId: 'static-web', resetToken : token})
          .end(function (err) {
            if (err) {
              // if username is unknown - this returns a 404 as the DNS can't resolve
              $('#passwordError').text('Username unknown: ' + username).show();
              setPass.find('input[type=submit]').prop('disabled', false);
              return stepDone(err);
            }
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
            stepDone();
          })
      }
    ]);
  }
};
