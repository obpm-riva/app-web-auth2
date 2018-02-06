var $ = require('jquery');
var methods = require('../access/methods');

module.exports.requestRegisterUser = function (returnURL, appID, lang, Settings, loginCallback) {
  var registerForm = $('#registerForm');
  var username = registerForm.find('input[name=username]').val();
  var email = registerForm.find('input[name=email]').val();
  var pass = registerForm.find('input[name=pass]').val();
  var rePass = registerForm.find('input[name=rePass]').val();
  var hosting = $('#hosting').val();
  var reg = Settings.info.register;

  if (! email) {
    email = username + '@obpm-dev.io';
  }

  if(pass !== rePass) {
    $('#registerError').text('Password does not match the confirm password.').show();
  } else {
    $('#registerError').hide().empty();
    registerForm.find('input[type=submit]').prop('disabled', true);
    $.post(reg + '/user',
      {
        appid: appID,
        username: username,
        password: pass,
        email: email,
        languageCode: lang,
        hosting: hosting,
        // TODO: maybe make this optional
        invitationtoken: 'enjoy'
      })
      .done(function () {
        registerForm.get(0).reset();
        $('#loginUsernameOrEmail').val(username);
        $('#loginPassword').val(pass);
        $('#registerContainer').hide();

        if (Settings.isRegisterStandalone()) {
          var redirect = returnURL || Settings.getApiURL(username);
          window.location.replace(redirect);
        } else {
          // Do Login if not standalone
          methods.loginToPryvFromParams({
            usernameOrEmail: username,
            password: pass,
            settings: Settings
          }, function (err, Settings) {
            if (err) {
              // Avoid this with a preliminary check in reg?
              if(err.toString().indexOf('Request has been terminated') !== -1) {
                Settings.utils.printError('Unknown username');
              } else {
                Settings.utils.printError(err);
              }
              loginCallback(err, Settings);
            }
            Settings.logIn = true;
            loginCallback(null, Settings);
          });
        }
      })
      .fail(function (xhr) {
        var message;
        if(xhr.responseJSON.errors && xhr.responseJSON.errors.length > 0) {
          message = xhr.responseJSON.errors[0].message;
        } else {
          message = xhr.responseJSON.message;
        }
        $('#registerError').text(message).show();
        $('#registerForm').find('input[type=submit]').prop('disabled', false);
      });
  }
};

/**
 * Check if username is already used.
 *  If not used, it returns the username,
 *  otherwise, returns false.
 *
 * @param username
 * @param params
 * @param params.register
 * @param callback
 */
module.exports.checkUsername = function (username, params, callback) {
  $.get(params.reg + '/' + username + '/check_username')
    .done(function (data) {
      console.log('got data', data);
      if (! data.reserved) {
        callback(null, username);
      } else {
        callback(null, false);
      }
    });
};

module.exports.retrieveHostings = function (reg) {
  var registerForm = $('#registerForm');
  var hostings = $('#hosting');
  registerForm.find('input[type=submit]').prop('disabled', true);
  $.get(reg +'/hostings')
    .done(function (data) {
      $('#registerError').hide().empty();
      registerForm.find('input[type=submit]').prop('disabled', false);
      $.each(data, function (i, optgroups) {
        $.each(optgroups, function (groupId, group) {
          var $optgroup = $('<optgroup>', {label: group.name});
          $optgroup.appendTo(hostings);
          if (group.zones) {
            $.each(group.zones, function (zoneId, zone) {
              var zoneName = zone.name;
              if (zone.hostings) {
                $.each(zone.hostings, function (hostingId, hosting) {
                  var $option = $('<option>', {
                    text: zoneName + (! hosting.available ? ': coming soon' : ''),
                    value: hostingId
                  });
                  $option.appendTo($optgroup);
                });
              }
            });
          }
        });
      });

    })
    .fail(function (xhr) {
      $('#registerError').text('Unable to retrieve hostings: ' + xhr.responseJSON.message).show();
    });
};