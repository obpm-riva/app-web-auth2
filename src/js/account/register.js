/* jshint ignore:start */

var $ = require('jquery');
var Settings = require('../utils/Settings');

var getURLParameter = function (name) {
  return decodeURIComponent((new RegExp(name + '=' + '(.+?)(&|$)')
    .exec(location.search)||['',''])[1]);
};

var requestRegisterUser = function (e) {
  e.preventDefault();
  var registerForm = $('#registerForm');
  var username = registerForm.find('input[name=username]').val();
  var email = registerForm.find('input[name=email]').val();
  var pass = registerForm.find('input[name=pass]').val();
  var rePass = registerForm.find('input[name=rePass]').val();
  var hosting = $('#hosting').val();

  if(pass !== rePass) {
    $('#error').text('Password confirmation failed!').show();
  } else {
    $('#error').hide().empty();
    registerForm.find('input[type=submit]').prop('disabled', true);
    var reg = Settings.retrieveServiceInfo().replace('/service/infos', '');
    $.post(reg + '/user',
      {
        appid: getURLParameter('requestingAppId'),
        username: username,
        password: pass,
        email: email,
        languageCode: getURLParameter('lang'),
        hosting: hosting,
        // TODO: maybe make this optional
        invitationtoken: 'enjoy'
      })
      .done(function () {
        window.location.replace('https://' + username + '.' +
          reg.replace('https://reg.', '') + '/#/SignIn');
      })
      .fail(function (xhr) {
        $('#error').text(xhr.responseJSON.message).show();
        registerForm.find('input[type=submit]').prop('disabled', false);
      });
  }
};

function retrieveHostings () {
  var registerForm = $('#registerForm');
  var hostings = $('#hosting');
  registerForm.find('input[type=submit]').prop('disabled', true);
  var reg = Settings.retrieveServiceInfo().replace('/service/infos', '');
  $.get(reg +'/hostings')
    .done(function (data) {
      $('#error').hide().empty();
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
      $('#error').text('Unable to retrieve hostings: ' + xhr.responseJSON.message).show();
    });
}

$(document).ready(function(){
  var $registerForm = $('#registerForm');
  retrieveHostings();
  $registerForm.on('submit', requestRegisterUser);
});