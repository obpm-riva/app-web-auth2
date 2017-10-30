var $ = require('jquery');
var Settings = require('../utils/Settings');

$(document).ready(function(){
  var $toggle = $('#signinhub-form-toggle');
  var $alert = $('.alert');

  $toggle.click(function () {
    $toggle.prop('disabled', true);
    $alert.addClass('hidden');
    var username = $('#signinhub-input').val().trim();
    var reg = Settings.retrieveServiceInfo().replace('/service/infos', '');
    var domain = reg.replace('https://reg.', '');
    $.post(reg + '/' + username + '/server').done( function () {
      window.location = 'https://' + username + '.' + domain + '/#/SignIn';
    }).fail(function () {
      $alert.removeClass('hidden');
    }).always(function () {
      $toggle.prop('disabled', false);
    });
  });
});