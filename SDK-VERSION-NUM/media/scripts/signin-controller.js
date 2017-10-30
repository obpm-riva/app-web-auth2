var PryvCustomization = {
  serviceName : 'Pryv',
  registrationUrl : 'http://pryv.com/register',
  termsOfUseUrl : 'http://pryv.com/terms-of-use/',
  privacyUrl : 'http://pryv.com/privacy/'
};


/**
 * Module to manage authorization popup activities. This module is responsible
 * for authorizing the user and registering new user.
 * @module AuthController
 */

var AuthController = {

  initialUrl : window.location.href + '',

  /**
   * Localization
   */
  _localizedlStrings: {
    en: {
      windowTitle: '' + PryvCustomization.serviceName + ' — Sign in',
      invalid_username: 'Invalid username or e-mail',
      invalid_password: 'Invalid password',
      unknown_username: 'Unknown username',
      unknown_email: 'Unknown e-mail address',
      statements: {
        allPryv: 'All ' + PryvCustomization.serviceName + ' without restrictions',
        allStreams : 'my ' + PryvCustomization.serviceName + '',
        stream : '\'#\' stream',
        create: 'Create #', //create toto stream
        manage : 'Fully manage content',
        read : 'Just read content',
        contribute : 'Add content'
      },
      dynamicLocalizableSelectors: {
        validationFormDetail : 'App <strong>#</strong> is requesting access to:',
        loaderMessage : ''
      },
      localizableSelectors: {
        'login-username-label': 'Username or e-mail',
        'login-password-label': 'Password',
        'validation-form-title' : 'Request for permission',
        'login-form-toggle': 'Not a user? Create an account',
        'register-form-toggle': 'Already a ' + PryvCustomization.serviceName + ' user? Sign in'
      },
      localizableFormSubmit: {
        'login-form-loginButton': 'Sign in',
        'login-form-cancelButton': 'Cancel'
      },
      localizablePlaceholders: {
      }
    },
    fr: {
      windowTitle: '' + PryvCustomization.serviceName + ' — Connexion',
      invalid_username: 'Vérifier le nom d\'utilisateur',
      invalid_password: 'Mot de passe non valide',
      unknown_username: 'Nom d\'utilisateur inconnu',
      unknown_email: 'Adresse e-mail inconnue',
      statements: {
        allPryv: 'Tout ' + PryvCustomization.serviceName + ' sans restrictions',
        allStreams: 'mon ' + PryvCustomization.serviceName + '',
        stream: 'Flux \'#\'',
        create: 'Création du \'#\'', //create toto folder
        manage: 'Accès intégral au contenu',
        read: 'Seulement en consultation',
        contribute: 'Ajout de contenu'
      },
      dynamicLocalizableSelectors: {
        validationFormDetail : 'L\'application <strong>#</strong> demande l\'autorisation pour:'
      },
      localizableFormSubmit: {
        'login-form-loginButton': 'Connexion',
        'login-form-cancelButton': 'Annuler'
      },
      localizableSelectors: {
        'login-username-label' : 'Identifiant ou e-mail',
        'login-password-label': 'Mot de passe',
        'validation-form-title' : 'Demande de permission',
        'login-form-toggle': 'Nouvel utilisateur? Créez un compte',
        'register-form-toggle': 'Déjà utilisateur? Connectez-vous'
      },
      localizablePlaceholders: {
      }
    }
  },

  /** holder for current language strings **/
  _l : null,


  /**
   * UI
   */


  /* DOM selectors. */
  _selectorMap : {
    loadingBlock: '#loading-block',
    loadingInfo: '#loading-info',
    /* Selectors deailing with user login. */
    loginForm: '#login-form',
    usernameDisplay : '#usernameDisplay',
    accessRequestDisplay : '#accessRequestDisplay',
    userOrLogin : '#loginUsernameOrEmail',
    password : '#loginPassword',
    submitButton : '#login-form-loginButton',
    cancelButton : '#login-form-cancelButton',
    alertBlock : '#alert-block',
    alertMessage : '#alert-message',

    /* Selectors dealing with user registration. */
    regUsername : '#sign-up-username',
    regEmail : '#sign-up-email',
    regPassword : '#sign-up-password',
    reg2ndpassword : '#sign-up-2ndpassword',
    registerButton : '#register',

    /* Selector dealing with permission validation. */
    validationFormWapper : '#validation-form-wrapper',
    validationFormDetail : '#validation-form-detail',
    permissionContentsWrapper : "#permission-contents-wrapper",
    permissionAccept : '#permissionAccept',
    permissionReject : '#permissionReject',
    iconApp : '#icon-app',

    /* Selectors of elements on the loading page. */
    loaderMessage : '#loader-message',

    /* Selectors shared across the login and registration form. */
    formToggle : '.form-toggle'

  },

  /* Array of dom elements exceptions from creating jquery elements. */
  _selectorMapExceptions : ['submitButton', 'registerButton', 'permissionReject', 'permissionAccept', 'formToggle'],

  /* Multiple views in the page. */
  _views : ['loader-wrapper', 'login-form-wrapper', 'registration-content-wrapper', 'validation-form-wrapper'],


  _localize : function () {
    var that = this;

    window.document.title = that._l.windowTitle;

    that._localizeElements(that._l.localizableSelectors,function(element,string) {
        element.innerHTML = string;
      }
    );

    that._localizeElements(that._l.localizableFormSubmit,function(element,string) {
        element.value = string;
      }
    );

    that._localizeElements(that._l.localizablePlaceholders,function(element,string) {
        element.placeholder = string;
      }
    );

  },

  /**
   * Helper for _localize
   * @param  elementMap
   * @param action function(element,string) to apply
   */
  _localizeElements: function (elementMap ,action) {
    for (var selector in elementMap) {
      if (elementMap.hasOwnProperty(selector)) {
        try {
          action(document.getElementById(selector), elementMap[selector]);
        } catch (e) {
          console.error('failed localizing: '+selector);
          throw e;
        }
      }
    }
  },



  // ---- ui control


  /**
   * Method to switch between the wrappers in authentication page.
   * @method _switchView
   * @access private
   * @param viewName page
   */
  _switchView : function (viewName)  {
    this._views.forEach(function (view) {
      document.getElementById(view).style.display = (view == viewName) ? 'block' : 'none';
    });
  },

  /**
   * Method to update the display panels.
   * @method _updateDisplay
   * @access private
   * @param string state
   */
  _updateDisplay : function(state, that) {
    if(!that) { that = this; }

    var state = state || false;

    if(state == that._const.STATE_LOADING_LOGIN) return;
    if(state == that._const.STATE_LOADING_CHECK_APP_ACCESS) return that._switchView('loader-wrapper');
    if(that._data.appToken)  return that._close(that);
    if(that._data.stateRefused) return that._close(that);
    if(that._data.ownToken && that._data.username && that._data.checkedPermissions)  {


      var appName =  that._data.requestingAppId;
      if (that._data.requestingAppInfos && that._data.requestingAppInfos.displayName) {
        appName = that._data.requestingAppInfos.displayName;
      }

      that._selectorMap.usernameDisplay.html(that._data.username);
      that._selectorMap.validationFormDetail.html(
        that._l.dynamicLocalizableSelectors.validationFormDetail.replace(
          '#', appName));

      that._preparePermissionBlocks(that._data.checkedPermissions);



      return that._switchView('validation-form-wrapper');
    }

    return that._switchView('login-form-wrapper');
  },

  /**
   * Method to prepare the permission block.
   * @method _preparePermissionBlocks
   * @access private
   * @param object checkedPermissions
   */
  _preparePermissionBlocks : function(checkedPermissions) {



    var htmlBlock = '',
      statements = this._l.statements,
      that = this;

    that._selectorMap.permissionContentsWrapper.html('');

    if (checkedPermissions === 'trusted') {
      this._selectorMap.permissionContentsWrapper.append(
        '<h2>' + statements.allPryv + '</h2>');
      return;
    }


    checkedPermissions.forEach(function (permission) {


      var folderName = '';
      var ol = '';
      var create = permission.hasOwnProperty('defaultName');
      var streamName = permission.hasOwnProperty('defaultName') ?
        permission.defaultName : permission.name;

      var streamTitle =  statements.stream.replace('#', streamName);
      if (create) {
        streamTitle =  statements.create.replace('#', streamTitle);
      }
      if (permission.streamId === '*') {
        streamTitle = statements.allStreams;
      }

      htmlBlock = that._templateBlender(that._permissionWrapperTpl);
      ol = htmlBlock.find('ol');
      htmlBlock.find('h2').append(streamTitle) + ': ' + statements[permission.level];
      //ol.append($('<li>'++'</li>'));

      that._selectorMap.permissionContentsWrapper.append(htmlBlock);
    });
  },




  /**
   * Method to handle validate and access the permissions requested by the app.
   * @method _accessValidateButtonPressed
   * @access private
   */
  _accessValidateButtonPressed : function() {
    this._switchView('loader-wrapper');
    var that = this;

    if (that._isPryvTrustedApp()) {
      that._success(that._data.ownToken);
      return;
    }

    if (that._data.mismatchingAccess) {
      that._deleteMissmatchingToken(function() { that._postAccess(that)} );
    } else {
      that._postAccess(that);
    }

  },

  /**
   * Method to handle when user refuses app to get access to his folder.
   * @method _accessRefuseButtonPressed
   * @access private
   */
  _accessRefuseButtonPressed : function() {
    this._switchView('loader-wrapper');
    this._refused('REFUSED_BY_USER','access refused by user');
  },


  /**
   * Method to handle the form toggling between login form and registration
   * form.
   * @method _onFormToggle
   * @access private
   * @param string mode
   */
  _onFormToggle : function(mode)  {
    if(mode.toUpperCase() == 'LOGIN') {
      this._switchView('registration-content-wrapper');
    }else {
      this._switchView('login-form-wrapper');
    }
  },

  /**
   * Method to handle alert.
   * @method _alertHandler
   * @access private
   * @param string provoker
   * @param {Boolean} [fatal = false]
   */
  _alertHandler : function(provoker, fatal)  {

    var provokerMessagesBase = {
        'registerUrl' : 'Badly formatted register URL!!',
        'queryStringMalstructured' : 'Malstructured Query String. Required parameters missing, check the URL!!',
        'default' : 'Internal Error!!'
      },
      provokerMessage = '',
      prefix = 'ERROR# ';

    if (provokerMessagesBase.hasOwnProperty(provoker)) {
      provokerMessage = prefix + provokerMessagesBase[provoker];
    } else {
      provokerMessage = prefix + provokerMessagesBase.default;
    }

    console.error('ALERT :' + provokerMessage);

    if (! this._alertHandlerNoMoreAlert) {
      alert(provokerMessage);
    }
    if (fatal) {
      this._alertHandlerNoMoreAlert = true;
    }
  },

  //-------------------------------------------------------------------------//

  /* Data object required for authentication. */
  _data : {
    lastState : {},

    /* Attributes represent parameters passed through the query string.
     In the key=>value, key represent the query string parameter and the
     value represent the strictness during parsing (optional/required).*/
    returnURL : 'optional',
    oauthState : 'optional',
    username : 'optional',
    ownToken : 'optional',
    poll : 'optional',
    uiLanguage : 'optional',
    lang : 'required',
    domain : 'required',
    key : 'required',
    requestingAppId : 'required',
    registerURL : 'required',
    requestedPermissions: 'optional',

    /* Controller workflow supporting attributes. */
    serverRelayIsOn : true,
    windowMessagingIsOn  :true,
    closing : false,
    uiSupportedLanguages : ['en', 'fr'],
    checkedPermissions: null,
    mismatchingAccess: null,
    stateRefused : false,
    appToken : null,
  },

  /* Template to render the permission wrapper blocks. */
  _permissionWrapperTpl : {
    tagName : 'div',
    className : 'permission-wrapper',
    subClass : [
      {
        tagName : 'div',
        className : 'permission-block',
        subClass : [
          {
            tagName : 'h2'
          },
          {
            tagName : 'ol'
          }
        ]
      }
    ]
  },

  /* constanst for the module. */
  _const : {
    STATE_LOADING_CHECK_APP_ACCESS : "STATE_LOADING_CHECK_APP_ACCESS",
    STATE_LOADING_LOGIN : "STATE_LOADING_LOGIN"
  },


  /**
   * Method to load dom event bindings.
   * @method _loadEventBindings
   * @access private
   */
  _loadEventBindings : function()  {
    this._selectorMap.cancelButton.click(function(event) {
      event.preventDefault();
      AuthController._accessRefuseButtonPressed();
    });


    $(document)
      .on('submit', this._selectorMap.loginForm, function(event) {
        event.preventDefault();
        AuthController._onLoginButtonPressed();
      })
      .on('click', this._selectorMap.submitButton, function(event) {
        event.preventDefault();
        AuthController._onLoginButtonPressed();
      })
      .on('click', this._selectorMap.registerButton, function(event) {
        event.preventDefault();
        AuthController._onRegisterPressed();
      })
      .on('click', this._selectorMap.permissionAccept, function(event) {
        event.preventDefault();
        AuthController._accessValidateButtonPressed();
      })
      .on('click', this._selectorMap.permissionReject, function(event) {
        event.preventDefault();
        AuthController._accessRefuseButtonPressed();
      })
      .on('click', this._selectorMap.formToggle, function(event) {
        event.preventDefault();
        AuthController._onFormToggle($(event.target).attr("data-mode"));
      });
  },


  /**
   * Method to create html templates from the custom JSON Template.
   * @method _templateBlender
   * @access private
   * @param object template
   * @return string
   */
  _templateBlender : function(template) {
    var $html = null, that = this;

    if(template.hasOwnProperty("tagName")) { $html = $(this._prepareTag(template.tagName)); }
    if(template.hasOwnProperty("className"))  { $html.addClass(template.className); }

    if(template.hasOwnProperty("subClass")) {
      template.subClass.forEach(function(div)  {
        $html.append(that._templateBlender(div));
      });
    }

    return $html;
  },

  /**
   * Method to prepare tag for the given input tagname.
   * @method _prepareTag
   * @access private
   * @param string tagName
   * @return string
   */
  _prepareTag : function(tagName){
    return '<X>'.replace('X', tagName);
  },


  // -- ui controller

  _onRegisterPressed : function() {
    console.log('on registration pressed!!!!!');
  },

  _onLoadingStart : function(strInfo) {
    this._selectorMap.loadingBlock.css('display','block');
    this._selectorMap.loadingInfo.html(strInfo);
    console.log("loading: "+strInfo);
  },

  _onLoadingStop : function() {
    this._selectorMap.loadingBlock.css('display','none');
    this._selectorMap.loadingInfo.html();
  },


  /**
   * Method to handle the login button click.
   * @method _onLoginButtonPressed
   * @access private
   */
  _onLoginButtonPressed : function()  {


    this._selectorMap.alertBlock.css('display','none');
    this._selectorMap.alertMessage.html('');

    if(this._selectorMap.password.val().length < 5) {
      this._selectorMap.alertBlock.css('display','block');
      this._selectorMap.alertMessage.html(this._l.invalid_password);
      return false;
    }

    var userOrLogin = this._selectorMap.userOrLogin.val().trim().toLowerCase();
    if(Pryv.Utility.regex.username.test(userOrLogin))  {
      this._loginWithUsername(userOrLogin, this._selectorMap.password.val());
    } else if(Pryv.Utility.regex.email.test(userOrLogin)) {
      this._loginWithEmail(userOrLogin);
    } else {
      this._selectorMap.alertBlock.css('display','block');
      this._selectorMap.alertMessage.html(this._l.invalid_username);
    }

    return false;
  },


  // --------------   controller

  /**
   * Method to initialize the data required for authorization.
   * @method init
   * @access public
   */
  init : function() {
    this._l = this._localizedlStrings.en;
    this._init(1);

  },

  /**
   * Method to initialize the data required for authorization.
   * @method _init
   * @access private
   */
  _init : function(i) {
    // start only if Pryv.Utility is loaded
    if (typeof Pryv.Utility == 'undefined') {
      if ((i+0) > 100) {
        throw new Error("Cannot find Pryv.Utility");
        return;
      }
      i++;
      return setTimeout(function () {
        AuthController._init(i);
      },1*i);
    }




    this._initSelectors();
    this._parseDataFromUrl();

    this._initRegistrationController(1);

    this._loadEventBindings();
    this._localize();
    if(this._data.windowMessagingIsOn)  {
      try {
        window.opener.postMessage({status: 'POPUPINIT'},'*');
      } catch(error) { console.log('Failed communicating with opener. (OK if not a popup)'); }
    }
    this._loadAppList();
  },

  _initRegistrationController : function (i) {
    var that = AuthController;

    if ((typeof RegistrationController === 'undefined') && (! RegistrationController.uiLoaded)) {
      if ((i+0) > 100) {
        throw new Error("Cannot find RegistrationController");
        return;
      }
      i++;
      return setTimeout(function () {
        AuthController._initRegistrationController(i)
      },1*i);
    }

    RegistrationController.init(
      that._data.registerURL,
      that._data.requestingAppId, function(error,result) {
      if (error) {
        return that._errorHandler(error);
      }
      console.log("Success !!" + result.username + result.username);
      //that._switchView('login-form-wrapper');
      that._selectorMap.password.val(result.password);
      that._selectorMap.userOrLogin.val(result.username);
      that._loginWithUsername(result.username,  result.password);


    }, that._data.uiLanguage);
  },


  /**
   * Method to initialize the dom selector object.
   * @method _initSelectors
   * @access private
   */
  _initSelectors : function() {
    var that = this;
    for(var selector in this._selectorMap) {
      var selectorName =  that._selectorMap[selector];
      if(this._selectorMapExceptions.indexOf(selector) < 0)  {
        try {
          this._selectorMap[selector] = $(selectorName);
        } catch (e) { }
        if (typeof(this._selectorMap[selector]) == 'undefined') {
          console.warn("cannod find item :"+selectorName+" for: "+selector+" in DOM");
        }
      }
    }
  },

  /**
   * Method to parse the data requrired for authentication from the url.
   * @method _parseDataFromUrl
   * @access private
   */
  _parseDataFromUrl : function()  {
    var that = this;


    for(var attribute in this._data)  {
      var parameter = attribute,
        strictMode = this._data[attribute];

      if(strictMode === 'required' || strictMode === 'optional') {
        this._data[attribute] = this._urlParam(parameter,(strictMode === 'required') ? true : false);
      }
    }

    this._data.returnURL = this._cleanseUrl(this._data.returnURL);
    this._data.registerURL = this._cleanseUrl(this._data.registerURL);
    // set languages
    this._data.uiLanguage = Pryv.Utility.getPreferredLanguage(this._data.uiSupportedLanguages,this._data.lang);
    this._l = this._localizedlStrings[this._data.uiLanguage];

    if (!this._data.registerURL) {
      return this._alertHandler('registerUrl');

      return this._errorHandler({
        message: "Badly formated registerURL",
        detail: "registerURL: "+registerURL,
        id: "INTERNAL_ERROR"
      });
    }

    this._data.poll = this._urlParam('poll', false);

    if (this._data.poll) {

      that.appAccessNeedsToBeCalledAgain = 1;

      this._data.poll = decodeURIComponent(this._data.poll);

      Pryv.Utility.XHR({
        url : that._data.poll,
        type : 'GET',
        success : function(data)  {
          if(data.requestedPermissions) {
            that._data.requestedPermissions = data.requestedPermissions;
            that._updateDisplay();
            that._onLoadingStop();
            that._checkAppAccess();
          }else {
            that._errorHandler({
              id : 'INTERNAL_ERROR',
              message : 'invalid data from relay: ' + JSON.stringify(data)
            });
          }
        },
        error : that._errorHandler

      });
    } else {
      that.appAccessNeedsToBeCalledAgain = 0;
      try {
        that._data.requestedPermissions = JSON.parse(that._cleanseUrl(that._data.requestedPermissions));
      } catch(error)  {
        that._errorHandler({
          message : "Failed parsing requestedPermissionsURIEncoded",
          detail : "",
          id : 'INTERNAL_ERROR'
        });
      }
      that._updateDisplay();
      that._onLoadingStop();
    }
  },


  /**
   * Method to login with email.
   * @method _loginWithEmail
   * @access private
   * @param string email
   */
  _loginWithEmail : function(email)  {
    var that = this,
      url = this._data.registerURL + '/' + email + '/uid';

    that._onLoadingStart('login with e-mail');
    Pryv.Utility.XHR({
      url: url,
      type : 'GET',
      context : that,
      success : that._onSuccessLoginWithEmail,
      error : that._onFailureLoginWithEmail
    });

  },

  /**
   * Method to checkh if current session is from a trusted app
   * @private
   */
  _isPryvTrustedApp : function() {
    return ((this._data.requestingAppId.indexOf('pryv') == 0) &&
      (this._data.requestedPermissions[0].trusted == 'pryv'));
  },

  /**
   * Method to login using username.
   * @method _loginWithUsername
   * @access private
   */
  _loginWithUsername : function(username, password) {
    // controlSignin.updateDisplay(STATE_LOADING_LOGIN);




    var that = this, params = {
      username : username,
      password : password,
      appId : 'pryv-web-access'
    }

    if (that._isPryvTrustedApp()) {
      params.appId = that._data.requestingAppId;
    }


    var url = '';


    that._onLoadingStart('login with username');
    url = 'https://' + username + '.' + this._data.domain + '/auth/login';

    Pryv.Utility.XHR({
      url : url,
      context : that,
      params : params,
      success : function(response,that) {
        that._onSuccessLoginWithUsername(username,response,that);
      },
      error : that._onFailureLoginWithUsername
    });
  },

  /**
   * Method to handle if login with username is success.
   * @method _onSuccessLoginWithUsername
   * @access private
   * @param object response
   */
  _onSuccessLoginWithUsername : function(username,response, that)  {

    if(response.token)  {
      that._data.ownToken = response.token;
      that._data.username = username;
      that._data.lang = response.preferredLanguage || that._data.lang;

      // pryv-applications

      if (that._isPryvTrustedApp()) {
        that._data.username = username;
        response.checkedPermissions = 'trusted';
        that._onSuccessCheckAppAccess(response, that);
        return;
      }



      that._checkAppAccess();
    } else if(response.error.id === 'invalid-credentials') {
      that._onLoadingStop();
      that._selectorMap.alertBlock.css('display', 'block');
      that._selectorMap.alertMessage.html(that._l.invalid_password);
    } else  {
      that._errorHandler({ id : 'INTERNAL_ERROR', message : 'No token found in response' });
    }
  },

  /**
   * Method to handle if login with username fails.
   * @method _onFailureLoginWithUsername
   * @access private
   * @param object response
   */
  _onFailureLoginWithUsername : function(response, that)  {
    that._onLoadingStop();
    if(response.xhr && response.xhr.status == 0)  {
      that._selectorMap.alertBlock.css('display','block');
      that._selectorMap.alertMessage.html(that._l.unknown_username);
    } else  {
      that._errorHandler(response);
    }
  },


  /**
   * Method to handle if login with email is success.
   * @method _onSuccessLoginWithEmail
   * @access private
   * @param object response
   */
  _onSuccessLoginWithEmail : function(response, that) {
    if (response.uid) {
      that._loginWithUsername(response.uid, that._selectorMap.password.val());
    } else if (response.id == 'UNKNOWN_EMAIL') {
      that._onLoadingStop();
      that._selectorMap.alertBlock.css('display','block');
      that._selectorMap.alertMessage.html(that._l.unknown_email);
    } else if (response.id) {
      that._errorHandler(response)
    } else {
      that._errorHandler({ message : "loginWithEmail invalid data", detail : JSON.stringify(response), id : 'INTERNAL_ERROR' });
    }
  },

  /**
   * Method to handle if login with email fails.
   * @method _onFailureLoginWithEmail
   * @access private
   */
  _onFailureLoginWithEmail : function(jsonError, that)  {
    that._errorHandler(jsonError,that);
  },


  /**
   * Method to check application access.
   * @method _checkAppAccess
   * @acces private
   */
  _checkAppAccess : function()  {

    if (this.appAccessNeedsToBeCalledAgain > 0) {
      this.appAccessNeedsToBeCalledAgain--;
      return;
    }

    var that = this,
      url = 'https://' + this._data.username + '.' + this._data.domain + '/accesses/check-app',
      params = {
        requestingAppId : this._data.requestingAppId,
        requestedPermissions : this._data.requestedPermissions
      };
    that._onLoadingStart('checking app access');
    Pryv.Utility.XHR({
      url : url,
      params : params,
      context : that,
      headers : { authorization : that._data.ownToken },
      success : that._onSuccessCheckAppAccess,
      error : that._onFailureCheckAppAccess
    });
  },

  /**
   * Method to handle the success for the check app access.
   * @method _onSuccessCheckAppAccess
   * @access private
   * @param object response
   */
  _onSuccessCheckAppAccess : function(response, that)  {
    that._onLoadingStop();
    that._updateDisplay(that._const.STATE_LOADING_CHECK_APP_ACCESS);
    if(response.checkedPermissions) {
      that._data.checkedPermissions = response.checkedPermissions;
      that._data.mismatchingAccess = response.mismatchingAccess;
      that._updateDisplay()
    } else if(response.matchingAccess)  {
      that._success(response.matchingAccess.token);
    } else if(response.error)  {
      that._errorHandler(response.error);
    } else  {
      that._errorHandler({
        id : 'INTERNAL_ERROR',
        message : 'checkAppAccess() cannot find checkedPermissions in response'
      });
    }
  },


  /**
   * Method ot handle the failure for the check app access.
   * @method _onFailureCheckAppAccess
   * @access private
   */
  _onFailureCheckAppAccess : function(jsonResult,that)  {
    that._errorHandler(jsonResult,that);
  },


  /**
   * Method to delete Missmatching Token from the server.
   * @method _deleteMissmatchingToken
   * @access private
   * @param next
   */
  _deleteMissmatchingToken : function(next) {
    var that = this,
      url = 'https://' + this._data.username + '.' + this._data.domain + '/accesses/' + this._data.mismatchingAccess.id;

    Pryv.Utility.XHR({
      url : url,
      info : "delete mismatching token",
      type : 'DELETE',
      headers : { authorization : that._data.ownToken },
      context : that,
      success : function(data, context, xhr) {
        if (xhr.status != 200 && xhr.status != 204) {
          return that._errorHandler({message: "Failed deleting token", detail: xhr.statusText, id: "INTERNAL_ERROR", xhr: xhr});
        }
        next();
      },
      error : that._errorHandler
    });
  },



  /**
   * Method to perform post access operation.
   * @method _postAccess
   * @access private
   */
  _postAccess : function(that) {
    var params = {
      name : that._data.requestingAppId,
      permissions : that._data.checkedPermissions,
      type : 'app'
    };

    var url = 'https://' + that._data.username + '.' + that._data.domain + '/accesses';

    Pryv.Utility.XHR({
      url : url,
      headers : { authorization : that._data.ownToken },
      params : params,
      type : 'POST',
      success : function(data)  {
        if(!data.access) {
          return that._errorHandler({
            message : 'Failed get-app-token',
            detail : 'postAccess data' + JSON.stringify(data),
            id : "INTERNAL_ERROR"
          });
        }

        that._success(data.access.token);
      },
      errors : that._errorHandler
    });
  },



  /**
   * Method to handle the success from the checking application access and
   * post accessing.
   * @method _success
   * @access private
   * @param string appToken
   */
  _success : function(appToken) {
    this._data.appToken = appToken;

    var that = this, newState = {
      status : 'ACCEPTED',
      username : that._data.username,
      token : that._data.appToken,
      lang : that._data.lang
    }
    that._selectorMap.loaderMessage.html('<H4>Access granted for ' + that._data.username + '</H4>');
    this._sendState(newState, that._updateDisplay);
  },


  /**
   * Method to handle when user refused to give permission to the app to access
   * to his folders.
   * @method _refused
   * @access private
   * @param string reasonId
   * @param string message
   */
  _refused : function(reasonId, message)  {
    this._data.stateRefused = true;
    this._selectorMap.loaderMessage.html('<H4>Access canceled</H4>');
    this._sendState({
      status: 'REFUSED',
      reasonID: reasonId,
      message: message
    }, this._updateDisplay, this._updateDisplay);
  },


  /**
   * Method to send state.
   * @method _sendState
   * @access private
   * @param object state
   * @param object callback
   * @param object callbackError
   */
  _sendState : function(state, callback, callbackError) {
    var that = this;



    this._data.lastState = state;
    callback = callback || function() {};
    callbackError = callbackError || function() {};

    // add state in the current URL (used by iOs)
    var nextUrl = this.initialUrl + '#pryv=status';
    for(var key in state)  {
      if(state.hasOwnProperty(key))  {
        nextUrl +=  '&' + key + '=' + encodeURIComponent(state[key]);
      }
    }
    window.location.href = nextUrl;


    if(this._data.windowMessagingIsOn)  {
      try {
        window.opener.postMessage(state,'*');
      } catch(error) { console.log('Failed communicating with opener. (OK if not a popup)'); }
    }

    if(this._data.serverRelayIsOn)  {
      var url = this._data.registerURL + '/access/' + this._data.key;

      Pryv.Utility.XHR({
        url : url,
        type : 'POST',
        async : true,
        context : that,
        params : state,
        success : callback,
        error : callbackError
      });
    }
  },




  /**
   * Method to handle all errors.
   * @method _errorHandler
   * @access private
   * @param object error
   */
  _errorHandler : function(error, that) {
    that = that || this;
    that._onLoadingStop();

    if (error.error) { error = error.error; } // API v0.7 quickfix
    console.log(error);

    that._selectorMap.loaderMessage.html('<H4>Error in process</H4>');

    var newState = {
      status : "ERROR",
      id: error.id || 'INTERNAL_ERROR',
      message:  error.message || '',
      detail:  error.detail || ''
    }

    that._data.lastState = newState;
    if (that.closing) { // already closing
      console.log("Already closing .. skiping this error");
      console.log(error);
    } else if(that._data.key && (error.id != 'INVALID_KEY')) {
      that._sendState(newState, function () { that._close(that); }, console.log);
    }else {
      //TODO translate ids into readable messages
      alert('ERROR: ' + JSON.stringify(error));
    }
  },

  /**
   * Method to close window.
   * @method _close
   * @access private
   */
  _close : function(that) {
    if(that._data.closing)  return;
    that._data.closing = true;
    if(this._data.returnURL)  {

      var params = that._data.lastState;
      var nextURL = that._data.returnURL;

      if (this._data.oauthState) {
        nextURL += '&state=' + this._data.oauthState;
        if (params.status === 'REFUSED') {
          nextURL += '&error=access_denied';
        } else if (params.status === 'ACCEPTED') {
          nextURL += '&code=' + that._data.key;
        } else {
          nextURL += '&error=' + params.status;
        }

        that._data.returnURL += '&'
      } else {
        that._data.returnURL += 'prYvkey=' + that._data.key;


        for(var key in params)  {
          if(params.hasOwnProperty(key))  {
            nextURL += '&prYv' + key + '=' + encodeURIComponent(params[key]);
          }
        }
      }

       location.href = nextURL;
    } else  {

      //throw Error("should close") ;
      window.close();
    }
  },

  //--------- private utils


  /**
   * Method to decode to url.
   * @method _cleanseUrl
   * @access private
   * @param string url
   * @return string
   */
  _cleanseUrl : function(url)  {
    return url ? decodeURIComponent(url) : false ;
  },

  /**
   * Method to parse query string and retrive data requested.
   * @method _parseUrl
   * @access private
   * @param string name
   * @param boolean strict
   * @return string
   */
  _urlParam : function(name,strict){
    var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (! results || (! results[1])) {
      if (strict) {

        this._alertHandler('queryStringMalstructured', true);
        this._close(this);
        return this._errorHandler({
          message : 'invalid data in query string',
          detail : 'A system error occured, please try again later. (missin ' + name + 'param)',
          id : "INTERNAL_ERROR"
        });
      }  else {
        return false;
      }
    }
    return (results[1] == "false") ? false : results[1];
  },


  /**
   * -------- app list ---------
   */
  // fill app list
  _loadAppList : function () {
    var that = this;
    that._onLoadingStart('loading app list');
    Pryv.Utility.XHR({
      context: that,
      type: 'GET',
      url: that._data.registerURL + '/apps',
      success: function (result) {
        that._onLoadingStop();
        if (result.id) {
          that._errorHandler(result);
        } else {
          that._data.appList = result;
          that._refreshAppInfos();
        }
      },
      error: function (pryvError /*, context*/) {
        that._onLoadingStop();
        that._errorHandler(pryvError);

      }
    });
  },

  _refreshAppInfos : function() {
    if (! this._data.appList || ! this._data.appList.apps ||
      ( Object.prototype.toString.call( this._data.appList.apps ) !== '[object Array]' )
      ) {
      console.log('<ERROR> _refreshAppInfos: missing app list');
      return ;
    }


    console.log(this._data.appList);

    var appInfos;
    for (var i = 0; i < this._data.appList.apps.length ; i++) {
       if (this._data.appList.apps[i].id === this._data.requestingAppId) {
         appInfos = this._data.appList.apps[i];
         break;
       }
    }

    if (! appInfos) {
      console.log('<ERROR> _refreshAppInfos: no infos for app [' +
        this._data.requestingAppId + ']');
      return  ;
    }
    console.log(appInfos);
    this._data.requestingAppInfos = appInfos;

    if (appInfos.iconURL) {
      this._selectorMap.iconApp.attr('src', appInfos.iconURL);
    }

  }

};
