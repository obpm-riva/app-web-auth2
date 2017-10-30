/*global $, Pryv, document, alert  */
/*jshint -W101*/

var PryvCustomization = {
  serviceName : 'Pryv',
  registrationUrl : 'http://pryv.com/register',
  termsOfUseUrl : 'http://pryv.com/terms-of-use/',
  privacyUrl : 'http://pryv.com/privacy/'
};

var RegistrationController;
RegistrationController = {
  uiLoaded: false,  // used by access.html (AuthController  to test that all needed components are loaded)

  /**
   * Current language code
   * @api private
   */
  _languageCode: 'en',

  /**
   * holder for current language strings
   * @api private
   */
  _l: null,

  _data: {
    hostings: {}, //hold the hostings data
    hostingsIndex: {}
  },

  _params: {
    preferredLanguageCode: null,
    callback: null,
    appId: null
  },

  /**
   * Localization
   */
  _localizedStrings: {
    en: {
      internalError: 'Sorry, an unexpected error occurred.',
      windowTitle: PryvCustomization.serviceName + ' — Sign in',
      invalid_username: 'Minimum 5 characters, "-" accepted',
      reserved_username: 'Username reserved',
      invalid_email: 'Invalid email address',
      reserved_email: 'There already exists a ' + PryvCustomization.serviceName +
        ' account with this e-mail address',
      invalid_password: 'Password must be at least 6 characters',
      invalid_cpassword: 'Passwords must match',
      unknown_username: 'Unknown username',
      invalid_invitationtoken: 'Invalid invitation code',
      unknown_email: 'Unknown e-mail address',
      hosting_unavailable_error: 'Unavailable hosting, please pick another one',
      hosting_unavailable: 'Unavailable',


      localizableSelectors: {
        'invitationtoken-form-header': 'By invitation only',
        'invitationtoken-form-footer' : 'No invitation code? <a href="' + PryvCustomization.registrationUrl + '">Apply to our beta</a>',
        'registration-form-register': 'Start your free trial',
        'registration-disclamer': 'By clicking on "Create" below you agree with our <a href="' + PryvCustomization.termsOfUseUrl + '" target="_blank"><strong>terms of use</strong></a> and our <a href=' + PryvCustomization.privacyUrl + ' target="_blank"><strong>privacy policy</strong></a>.',
        'hostingChoiceInfoHeader': 'Why choose my hosting provider?',
        'hostingChoiceInfoText': PryvCustomization.serviceName + ' allows you to choose where your personal data is stored.' +
          '<h4>Here are some selection criteria:</h4><ul>' +
          '<li>Closer is usually quicker' +
          '<li>Option to opt for "green"/"responsible" hosting' +
          '<li>Legal context: some countries enforce very strict laws on personal data protection.' +
          '</ul>' +
          'No need to choose now! You can leave the default choice and move your data later on.',

        successMessageHeader: 'Welcome to ' + PryvCustomization.serviceName,
        successMessageText: 'Registration successful!'
      },
      localizableFormSubmit: {
        'invitationtoken-submit': 'Validate',
        'registration-submit': 'Create'
      },
      localizablePlaceholders: {
        'form_invitationtoken_input': 'Invitation code',
        'form_username_input': 'Use at least 5 characters',
        'form_email_input': '',
        'form_password_input': '',
        'form_cpassword_input': ''
      },
      localizableSpans: {
        'form_invitationtoken_label': 'Please enter your invitation code',
        'form_username_label': 'Username',
        'form_email_label': 'E-mail address',
        'form_password_label': 'Password',
        'form_cpassword_label': 'Confirm password',
        'form_hosting_label': 'Host my data in'
      }
    },
    fr: {
      internalError: 'Désolé, une erreur imprévue s\'est produite.',
      windowTitle: '' + PryvCustomization.serviceName + ' — Connexion',
      invalid_username: 'Minimum 5 charactères, "-" accepté',
      reserved_username: 'Nom réservé',
      invalid_email: 'Email non-valide',
      reserved_email: 'Il existe déjà un compte ' + PryvCustomization.serviceName + ' avec cette adresse',
      invalid_password: 'Utilisez au moins six charactères',
      invalid_cpassword: 'Les mots de passe doivent correspondre',
      invalid_invitationtoken: 'Code d\'invitation non valide',
      unknown_username: 'Nom d\'utilisateur inconnu',
      unknown_email: 'Adresse e-mail inconnue',
      hosting_unavailable: 'Non disponible',
      hosting_unavailable_error: 'Hébergement non disponible, choisissez-en un autre',

      localizableSelectors: {
        'invitationtoken-form-header': 'Sur invitation seulement',
        'invitationtoken-form-footer' : 'Pas de code d\'invitation? <a href="' + PryvCustomization.registrationUrl + '">Inscrivez-vous pour la béta</a>',
        'registration-form-register': 'Tester ' + PryvCustomization.serviceName + ' gratuitement.',
        'registration-disclamer': 'En cliquant "Créer" ci-dessous, vous approuvez les <a href="' + PryvCustomization.termsOfUseUrl + '" target="_blank"><strong>Terms of use</strong></a> et la <a href="' + PryvCustomization.privacyUrl + '" target="_blank"><strong> Privacy Policy.</strong></a>.',

        'hostingChoiceInfoHeader': 'Pourquoi choisir son hébergement?',
        'hostingChoiceInfoText': '' + PryvCustomization.serviceName + ' vous propose de choisir ou vos données personnelles seront stockées.' +
            '<h4>Voici quelques critères de choix:</h4><ul>' +
            '<li>Le plus performant sera près de chez vous.' +
            '<li>Vous pouvez choisir un hébergement "écologique"/"responsable".' +
            '<li>Le contexte légal: certains pays ont un encadrement très strict en matière de protection des données et de la vie privée.' +
            '</ul>' +
            'Pas besoin de vous décider tout de suite! Vous pouvez laisser le choix par défaut et déplacer vos données par la suite.',

        successMessageHeader: 'Bienvenue sur ' + PryvCustomization.serviceName + '',
        successMessageText: 'Enregistrement réussi!'
      },
      localizableFormSubmit: {
        'invitationtoken-submit': 'Valider',
        'registration-submit': 'Créer'
      },
      localizablePlaceholders: {
        'form_invitationtoken_input': 'Code d\'invitation',
        'form_username_input': 'Au moins 5 charactères',
        'form_email_input': '',
        'form_password_input': '',
        'form_cpassword_input': ''
      },
      localizableSpans: {
        'form_username_label': 'Nom d\'utilisateur',
        'form_invitationtoken_label': 'Veuillez entrer votre code d\'invitation',
        'form_email_label': 'Addresse e-mail',
        'form_password_label': 'Mot de passe',
        'form_cpassword_label': 'Vérification du mot de passe',
        'form_hosting_label': 'Héberger mes données en'
      }
    }
  },

  /**
   * ----------------- UI
   */


  /* DOM selectors. */
  _selectorMap: {
    loadingBlock: '#loading-block',
    loadingInfo: '#loading-info',
    alertBlock : '#alert-block',
    alertMessage : '#alert-message',
    successMessage : '#successMessage',
    /* Selectors deailing with user registration. */
    form: '#registration-form'
  },

  /**
   * Array of dom key that points to registration-{key} control-label|input|help-block|help-inline
   */
  _selectorMapControlGroups: ['invitationtoken', 'email', 'username', 'password', 'cpassword', 'hosting'],

  /* Array of dom elements exceptions from creating jquery elements. */
  _selectorMapExceptions: ['submitButton', 'registerButton', 'permissionReject',
    'permissionAccept', 'formToggle'],

  /* Multiple views in the page. */
  _views: ['login-form-wrapper', 'registration-content-wrapper', 'validation-form-wrapper'],


  /**
   * TODO change argument order and set callback at the end  and settings as {appId, languageCode}
   * @param appId
   * @param callback {function} (error,result)
   * @param languageCode
   */
  init: function (configURL, appId, callback, languageCode) {
    var that = RegistrationController;
    that._params.appId = appId;
    that._params.preferredLanguageCode = languageCode;
    that._params.callback = callback || function () {
      console.log('registration done');
    };


    //for now configURL == registerURL
    console.log('configURL:' + configURL);
    console.log(that._params);
    that.config.registerURL = configURL;



    that._languageCode = Pryv.Utility.getPreferredLanguage(Object.keys(that._localizedStrings),
      that._params.preferredLanguageCode);

    // try to get referer informations
    console.log('cookies: ' + document.cookie);
    that._params.referer = that._readCookie('referer');

    //that._languageCode = "fr";

    Pryv.Utility.domReady(that._init.bind(that));
  },

  _init: function () {
    var that = RegistrationController; //TODO find out why it does not take "this"
    that._initSelectors();
    that._l = that._localizedStrings[that._languageCode];
    that._localize();
    that._initController();
    that._loadHostingList();
  },

  /**
   * Method to initialize the dom selector object.
   * @method _initSelectors
   * @access private
   */
  _initSelectors: function () {
    var that = this;
    // prepare all forms blocks
    var controlGroupItems = { label: ' .control-label', input: ' input',
      status: ' .help-block', error: ' .help-inline'};

    Object.keys(controlGroupItems).forEach(function (item) {
      that._selectorMapControlGroups.forEach(function (key) {
        that._selectorMap['form_' + key + '_' + item] =
          '#registration-' + key + controlGroupItems[item];
      });
    });

    // cleanup input
    delete that._selectorMap.form_hosting_input;
    that._selectorMap.form_hosting_select = '#registration-hosting select';


    Object.keys(that._selectorMap).forEach(function (selector) {
      var selectorName = that._selectorMap[selector];
      if (that._selectorMapExceptions.indexOf(selector) < 0) {
        try {
          that._selectorMap[selector] = $(selectorName);
        } catch (e) {}
        if (typeof(that._selectorMap[selector]) === 'undefined') {
          console.warn('cannod find item :"' + selectorName + '" for: "' + selector + '" in DOM');
        }
      }
    });

  },

  _localize: function () {
    this._localizeElementsById(this._l.localizableSelectors, function (element, string) {
        element.innerHTML = string;
      }
    );
    this._localizeElementsById(this._l.localizableFormSubmit, function (element, string) {
        element.value = string;
      }
    );
    this._localizeElementsOnMap(this._l.localizablePlaceholders, function (element, string) {
        element.get(0).placeholder = string;
      }
    );
    this._localizeElementsOnMap(this._l.localizableSpans, function (element, string) {
        element.get(0).innerHTML = string;
      }
    );

  },

  /**
   * Helper for _localize
   * @param  elementMap
   * @param action function (element,string) to apply
   */
  _localizeElementsById: function (elementMap, action) {
    for (var selector in elementMap) {
      if (elementMap.hasOwnProperty(selector)) {
        try {
          action(document.getElementById(selector), elementMap[selector]);
        } catch (e) {
          console.error('failed localizing by id: ' + selector);
          throw e;
        }
      }
    }
  },

  _localizeElementsOnMap: function (elementMap, action) {
    for (var key in elementMap) {
      if (elementMap.hasOwnProperty(key)) {
        try {
          action(this._selectorMap[key], elementMap[key]);
        } catch (e) {
          console.error('failed localizing on map:' + key);
          throw e;
        }
      }
    }
  },

  /**
   * -------- host list ---------
   */
  // fill host list
  _loadHostingList : function () {
    var that = this;
    that._onLoadingStart('loading hostings list');
    Pryv.Utility.XHR({
      context: that,
      type: 'GET',
      url: this.config.registerURL + '/hostings',
      success: function (result) {
        that._onLoadingStop();
        if (result.id) {
          that._errorHandler(result);
        } else {
          that._data.hostings = result;
          that._refreshHostingSelect();
        }
      },
      error: function (pryvError /*, context*/) {
        that._onLoadingStop();
        that._errorHandler(pryvError);

      }
    });
  },

  _refreshHostingSelect : function () {
    var that = this;
    var $select = that._selectorMap.form_hosting_select;
   // var $select = $('#registration-hosting select');
    $select.appendTo('#somewhere');

    function localizedName(element) {
      if (element.localizedName && element.localizedName[that._languageCode]) {
        return element.localizedName[that._languageCode];
      }
      return element.name;
    }

    function localizedDescription(element) {
      if (element.localizedDescription && element.localizedDescription[that._languageCode]) {
        return element.localizedDescription[that._languageCode];
      }
      return element.description;
    }

    $.each(that._data.hostings, function (i, optgroups) {
      $.each(optgroups, function (groupId, group) {
        var $optgroup = $('<optgroup>', {label: localizedName(group)});
        $optgroup.appendTo($select);
        if (group.zones) {
          $.each(group.zones, function (zoneId, zone) {
            var zoneName = localizedName(zone);
            if (zone.hostings) {
              $.each(zone.hostings, function (hostingId, hosting) {

                // save hosting availability
                that._data.hostingsIndex[hostingId] = hosting;

                var $option = $('<option>', {
                  // removed: + ': ' + localizedName(hosting)
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

    var $help = $('#registration-hosting').find('.help-block');
    // register a change listener
    $select.change(function () {
      var xHosting = that._data.hostingsIndex[$select.val()];
      var msg = '';
      if (! xHosting.available) {
        msg += that._l.hosting_unavailable + '<br>';
      }
      msg += xHosting.url + ' - ' + localizedDescription(xHosting);
      $help.html(msg);
    });
  },



  /**
   * ------- controller ---------
   */

  config: {
    registerURL: 'https://bogus2'
  },

  _initController: function () {
    var that = this;

    $.validator.addMethod(
      'invitationtoken',
      function (value, element) {
        return this.optional(element) || (value.length > 4);
      },
      that._l.invalid_invitationtoken
    );


    $.validator.addMethod(
      'username',
      function (value, element) {
        return this.optional(element) || Pryv.Utility.regex.username.test(value);
      },
      that._l.invalid_username
    );


    $.validator.addMethod(
      'pryvemail',
      function (value, element) {
        return this.optional(element) || Pryv.Utility.regex.email.test(value);
      },
      that._l.invalid_email
    );

    $.validator.addMethod(
      'hosting',
      function (value, element) {
        return this.optional(element) || that._data.hostingsIndex[value].available;
      },
      that._l.hosting_unavailable_error
    );

    $('#invitationtoken-form').validate({
      submitHandler: that.proceedInvitationtoken,
      rules: {
        invitationtoken: {
          required: true,
          invitationtoken: true,
          remote: {
            url: that.config.registerURL + '/access/invitationtoken/check/',
            type: 'post'
          }
        }
      },
      messages: {
        invitationtoken: {
          remote: that._l.invalid_invitationtoken,
          required: ''
        }
      },
      errorClass: 'help-inline',
      errorElement: 'span',
      highlight: function (element/*, errorClass, validClass*/) {
        $(element).parents('.form-group').removeClass('success');
        $(element).parents('.form-group').addClass('error');
        $(element).parents('.form-group').removeClass('has-success');
        $(element).parents('.form-group').addClass('has-error');
        that._invitationToken = false;
      },
      unhighlight: function (element/*, errorClass, validClass*/) {
        $(element).parents('.form-group').removeClass('error');
        $(element).parents('.form-group').addClass('success');
        $(element).parents('.form-group').addClass('has-success');
        $(element).parents('.form-group').removeClass('has-error');
        that._invitationToken = true;
      }
    });

    $('#registration-form').validate({
      submitHandler: that.proceedRegistration,
      rules: {
        hosting: {
          required: true,
          hosting: true
        },
        username: {
          required: true,
          username: true,
          remote: {
            url: that.config.registerURL + '/username/check/',
            type: 'post'
          }
        },
        email: {
          required: true,
          pryvemail: true,
          remote: {
            url: that.config.registerURL + '/email/check/',
            type: 'post'
          }
        },
        password: {
          required: true,
          minlength: 6
        },
        cpassword: {
          required: true,
          equalTo: '#registration-password-input'
        }
      },
      messages: {
        username: {
          remote: that._l.reserved_username,
          required: ''
        },
        email: {
          required: '',
          email: that._l.invalid_email,
          remote: that._l.reserved_email
        },
        password: {
          required: '',
          minlength: that._l.invalid_password
        },
        cpassword: {
          required: '',
          equalTo: that._l.invalid_cpassword
        }
      },

      errorClass: 'help-inline',
      errorElement: 'span',
      highlight: function (element/*, errorClass, validClass*/) {
        $(element).parents('.form-group').removeClass('success');
        $(element).parents('.form-group').addClass('error');
        $(element).parents('.form-group').removeClass('has-success');
        $(element).parents('.form-group').addClass('has-error');

      },
      unhighlight: function (element/*, errorClass, validClass*/) {
        $(element).parents('.form-group').removeClass('error');
        $(element).parents('.form-group').addClass('success');
        $(element).parents('.form-group').addClass('has-success');
        $(element).parents('.form-group').removeClass('has-error');
      }
    });
  },


  proceedInvitationtoken: function (/*form*/) {
    var that = this;

    // -- lock invitationToken
    that._invitationToken = true;

    if (that._invitationToken) {
      $('#registration-form-container').hide();
      $('#invitationtoken-form-container').show();
    } else {
      $('#registration-form-container').show();
      $('#invitationtoken-form-container').hide();
    }
  },

  proceedRegistration: function (/*form*/) {
    var that = RegistrationController;
    that._onLoadingStart('proceed registration');

    var data = {
      appid: that._params.appId,
      username: that._selectorMap.form_username_input.val().toLowerCase(),
      password: that._selectorMap.form_password_input.val(),
      email: that._selectorMap.form_email_input.val(),
      hosting: that._selectorMap.form_hosting_select.val(),
      languageCode: that._params.preferredLanguageCode,
      invitationtoken: that._selectorMap.form_invitationtoken_input.val()
    };

    if (that._params.referer) {
      data.referer = that._params.referer;
    }


    Pryv.Utility.XHR({
      context: that,
      url: that.config.registerURL + '/user',
      params: data,
      success: function (result /*, context, xhr*/) {
        that._onLoadingStop();

        if (result.username) {   // success
          result.password = data.password;
          that._successRegistration(result);
          return;
        }


        if (result.id) {
          that._messageAlert(result);
          return;
        }

        that._errorHandler({id: 'INTERNAL_ERROR', message: 'Unexpected result'});

      },
      error: function (pryvError /*, context*/) {
        that._onLoadingStop();
        that._errorHandler(pryvError);
      }
    });
  },

  _successRegistration : function (result) {
    var that = this;
    that._selectorMap.successMessage.modal({
      show: 'false'
    }).on('hidden', function () {
        that._params.callback(null, result);
      });
    return;
  },

  // --------------- state management ------------- //

  _onLoadingStart : function (strInfo) {
    this._selectorMap.loadingBlock.css('display', 'block');
    this._selectorMap.loadingInfo.html(strInfo);
    console.log('loading: ' + strInfo);
  },
  _onLoadingStop : function () {
    this._selectorMap.loadingBlock.css('display', 'none');
    this._selectorMap.loadingInfo.html();
  },

  // display an error message in the error placeholder
  _messageAlert : function (pryvError) {
    if (! pryvError) {
      this._selectorMap.alertBlock.css('display', 'none');
      this._selectorMap.alertMessage.html('');
      return;
    }

    this._selectorMap.alertBlock.css('display', 'block');
    this._selectorMap.alertMessage.html(pryvError.message);
    return false;
  },

  /**
   * Method to handle all errors.
   * @method _errorHandler
   * @access private
   * @param object error
   */
  _errorHandler : function (pryvError) {
    var that = this;
    that._onLoadingStop();
    console.log(pryvError);
    var msg = this._l.internalError + '\n ID: ' + pryvError.id +
      '\n Detail:' +  pryvError.message;
    alert(msg);
  },

  /**
   * Utility to read cookies
   * @param name
   * @returns {*}
   * @private
   */
  _readCookie : function (name) {
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    for (var i = 0 ;i < ca.length;i++) {
      var c = ca[i];
      while (c.charAt(0) === ' ') { c = c.substring(1, c.length); }
      if (c.indexOf(nameEQ) === 0) { return c.substring(nameEQ.length, c.length); }
    }
    return null;
  }

};

$.validator.setDefaults({ debug: true, success: 'valid' });



