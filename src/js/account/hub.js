var $ = require('jquery');
var Settings = require('../utils/Settings');

$(document).ready(function(){
  var $toggle = $('#signinhub-form-toggle');
  var $error = $('#error');
  $error.hide();

  $toggle.click(function () {
    $error.hide();
    $toggle.prop('disabled', true);
    var username = $('#signinhub-input').val().trim();
    var reg = Settings.retrieveServiceInfo().replace('/service/infos', '');
    var domain = reg.replace('https://reg.', '');
    $.post(reg + '/' + username + '/server').done( function () {
      window.location = 'https://' + username + '.' + domain + '/#/SignIn';
    }).fail(function () {
      $error.show();
    }).always(function () {
      $toggle.prop('disabled', false);
    });
  });
    
  $('#regButton').click(function(e) {
    e.preventDefault();
    var origin = location.href;
    location.href = origin.substring(0,origin.lastIndexOf('/') + 1) + 'access.html?returnUrl=' + origin + '&standaloneRegister=true';
  });
});