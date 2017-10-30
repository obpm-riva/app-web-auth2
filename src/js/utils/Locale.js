/* global module, require */

var $ = require('jquery'),
  pryv = require('pryv'),
  i18n = require('i18next-client');

var Locale = {};

/**
 * fetches and pars the lang parameter from url of the 'Access' page;
 * associates messages for the requested page with chosen language
 * @param page     {String}
 * @param callback {Function}
 * @returns        {*} if error
 */
Locale.translate = function (page, callback) {
  var lang = 'en';

  if (page === 'login') {
    lang = pryv.utility.urls.parseClientURL().parseQuery().lang;
    if (!lang) { return callback('Missing lang parameter in URL'); }
  }

  var options = {
    lng: lang,
    fallbackLng : 'en',
    resStore: require('./../../../locales.json')
  };

  i18n
    .init(options, function (err, t) {
      if (err) { return callback(err); }
      switch (page) {
        case 'login':
          updateLoginHTML(t);
          callback(null, {
            /* Errors */
            missingPoll: t('missing-poll'),
            missingLang: t('missing-lang'),
            genericError: t('generic-error'),
            missingPassword: t('missing-password'),
            missingUsername: t('missing-username'),
            missingServiceInfo: t('missing-service-info'),
            missingUsernameAndPassword: t('missing-username-and-password'),

            /* States */
            uidWithMail: t('uid-with-mail'),
            accessCleaned: t('access-cleaned'),
            accessGranted: t('access-granted'),
            accessRefused: t('access-refused'),
            accessCanceled: t('access-canceled'),
            loginWithEmail: t('login-with-e-mail'),
            loginWithUsername: t('login-with-username'),

            /* Permissions */
            permissionsAll: t('permissions-all'),
            permissionsCreate: t('permissions-create'),
            permissionsUpdate: t('permissions-update'),
            permissionsRequestedBy: t('permissions-requested-by'),

            /* Ongoing processes */
            closing: t('closing'),
            sendingState: t('sending-state'),
            deletingAccess: t('deleting-access'),
            creatingStream: t('creating-stream'),
            creatingAccess: t('creating-access'),
            updatingAccess: t('updating-access'),
            loadingSettings: t('loading-settings'),
            fetchingStreams: t('fetching-streams'),
            fetchingAccesses: t('fetching-accesses'),
            loadingPermissions: t('loading-permissions'),
            checkingAppAccess: t('checking-app-access'),
            loadingServiceInfo: t('loading-service-info')
          });
          break;
        case 'register':
          break;
        case 'reset-password':
          break;
      }
    });
};

module.exports = Locale;

/**
 * update all text fields with the chosen language
 * @param t {Function}
 */
function updateLoginHTML(t) {
  var $loginFormTitle = $('#loginFormTitle'),
    $loginUsernameLabel = $('#loginUsernameLabel'),
    $loginPasswordLabel = $('#loginPasswordLabel'),
    $permissionsAccept = $('#permissionsAccept'),
    $permissionsReject = $('#permissionsReject'),
    $permissionsTitle = $('#permissionsTitle'),
    $loginFormToggle = $('#loginFormToggle'),
    $signInButton = $('#signInButton'),
    $cancelButton = $('#cancelButton');

  $loginUsernameLabel.text(t('login-username-label'));
  $loginPasswordLabel.text(t('login-password-label'));
  $loginFormTitle.text(t('login-form-register'));
  $permissionsAccept.text(t('permissions-accept'));
  $permissionsReject.text(t('permissions-reject'));
  $permissionsTitle.text(t('permissions-title'));
  $loginFormToggle.text(t('login-form-toggle'));
  $signInButton.text(t('sign-in-button'));
  $cancelButton.text(t('cancel-button'));
}