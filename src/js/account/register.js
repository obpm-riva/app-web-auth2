var $ = require('jquery');

module.exports.requestRegisterUser = function (returnURL, appID, lang, Settings) {
  var registerForm = $('#registerForm');
  var username = registerForm.find('input[name=username]').val();
  var email = registerForm.find('input[name=email]').val();
  var pass = registerForm.find('input[name=pass]').val();
  var rePass = registerForm.find('input[name=rePass]').val();
  var hosting = $('#hosting').val();
  var reg = Settings.info.register;

  if(pass !== rePass) {
    $('#registerError').text('Password confirmation failed!').show();
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
          $('#loginContainer').show();
        }
      })
      .fail(function (xhr) {
        $('#registerError').text(xhr.responseJSON.message).show();
        $('#registerForm').find('input[type=submit]').prop('disabled', false);
      });
  }
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