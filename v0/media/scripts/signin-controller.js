/**
 * Module to manage authorization popup activities. This module is responsible
 * for authorizing the user and registering new user.
 * @module AuthController
 */
var AuthController = {

  /* Data object required for authentication. */
  _data : {
    lastState : {},

    /* Attributes represent paramters passed through the query string.
    In the key=>value, key represent the query string parameter and the
    value represent the strictness during parsing (optional/required).*/
    returnURL : 'optional',
    username : 'optional',
    sessionID : 'optional',
    pollUrl : 'optional',
    uiLanguage : 'optional',
    lang : 'required',
    domain : 'required',
    key : 'required',
    requestingAppId : 'required',
    registerURL : 'required',
    requestedPermissions: 'required',

    /* Controller workflow supporting attributes. */
    serverRelayIsOn : true,
    windowMessagingIsOn  :true,
    closing : false,
    uiSupportedLanguages : ['en', 'fr'], 
    checkedPermissions: null, 
    mismatchingAccessToken: null,
    stateRefused : false,
    token : null
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
    STATE_LOADING_LOGIN : "STATE_LOADING_CHECK_APP_ACCESS"
  },

  /* DOM selectors. */
  _selectorMap : {
    /* Selectors deailing with user login. */
    usernameDisplay : '#usernameDisplay',
    accessRequestDisplay : '#accessRequestDisplay',
    userOrLogin : '#loginUsernameOrEmail',
    password : '#loginPassword',
    submitButton : '#loginButton',
    loginUsernameOrEmailCheck : '#loginUsernameOrEmailCheck',
    loginPasswordCheck : '#loginPasswordCheck',

    /* Selectors dealing with user registration. */
    regUsername : '#sign-up-username',
    regEmail : '#sign-up-email',
    regPassword : '#sign-up-password',
    reg2ndpassword : '#sign-up-2ndpassword',
    registerButton : '#register',

    /* Selector dealing with persmission validation. */
    validationFormWapper : '#validation-form-wrapper',
    permissionContentsWrapper : "#permission-contents-wrapper",
    permissionAccept : '#permissionAccept',
    permissionReject : '#permissionReject',

    /* Selectors shared across the login and registration form. */
    formToggle : '.form-toggle'
  },

  /* Array of dom elements exceptions from creating jquery elements. */
  _selectorMapExceptions : ['submitButton', 'registerButton', 'permissionReject', 'permissionAccept', 'formToggle'],

  /* Multiple vews in the page. */
  _views : ['login-form-wrapper', 'registration-form-wrapper', 'validation-form-wrapper'],

  /* Regular expressions. */
  _regex : {
    username : /^([a-zA-Z0-9]{5,21})$/,
    email : /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/
  },

  /**
   * Method to initialize the data required for authorization.
   * @method init
   * @access public
   */
  init : function() {
    this._parseDataFromUrl();
    this._initSelectors();
  },

  /**
   * Method to load dom event bindings.
   * @method loadEventBindings
   * @access public
   */
  loadEventBindings : function()  {
    var that = this;
    
    $(document)
    .on('click', that._selectorMap.submitButton, function() {
      that._onLoginButtonPressed();
    })
    .on('click', that._selectorMap.registerButton, function() {
      that._onRegisterPressed();
    })
    .on('click', that._selectorMap.permissionAccept, function() {
      that._accessValidateButtonPressed();
    })
    .on('click', that._selectorMap.permissionReject, function() {
      that._accessRefuseButtonPressed();
    })
    .on('click', that._selectorMap.formToggle, function(event) {
      that._onFormToggle($(event.target).attr("data-mode"));
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

  _onRegisterPressed : function() {
    console.log('on registration pressed!!!!!');
  },

  /**
   * Method to initialize the dom selector object.
   * @method _initSelectors
   * @access private
   */
  _initSelectors : function() {
    var that = this;
    for(var selector in this._selectorMap) {
      if(this._selectorMapExceptions.indexOf(selector) < 0) 
        this._selectorMap[selector] = $(that._selectorMap[selector]);
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
    this._data.uiLanguage = this._getPreferedLanguage(this._data.lang);

    if (!this._data.registerURL) {
      return this._alertHandler('registerUrl');

      return this._errorHandler({
        message: "Badly formated registerURL", 
        detail: "registerURL: "+registerURL, 
        id: "INTERNAL_ERROR"
      }); 
    }

    if (this._data.pollUrl) {
      this._data.pollUrl = decodeURIComponent(this._data.pollUrl);

      PrYvUtil.XHR({
        url : that._data.pollUrl,
        type : 'GET',
        success : function(data)  {
          if(data.requestedPermissions) {
            that._data.requestedPermissions = data.requestingPermissions;
            that._updateDisplay();
          }else {
            that._errorHandler({
              id : 'INTERNAL_ERROR',
              message : 'invalid data from relay: ' + JSON.stringify(data)
            });
          }
        },
        error : that._errorHandler

      });
    }else {
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
    }
  },

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

        this._alertHandler('queryStringMalstructured');
        this._close();
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
   * Method to handle the login button click.
   * @method _onLoginButtonPressed
   * @access private
   */
  _onLoginButtonPressed : function()  {
    this._selectorMap.loginUsernameOrEmailCheck.html();
    this._selectorMap.loginPasswordCheck.html('');

    if(this._selectorMap.password.val().length > 5) {
      if(this._regex.username.test(this._selectorMap.userOrLogin.val()))  {
        this._loginWithUsername(this._selectorMap.userOrLogin.val());
        return;
      }
      if(this._regex.email.test(this._selectorMap.userOrLogin.val())) {
        this._loginWithEmail(this._selectorMap.userOrLogin.val());
        return;
      }
    }else {
      this._selectorMap.loginUsernameOrEmailCheck.css('display','block');
      this._selectorMap.loginUsernameOrEmailCheck.html('Please check ur credentials.');
    }
    // controlSignin.loginPasswordCheck.html(SIGNIN_MESSAGES['INVALID_PASSWORD']);
  },

  /**
   * Method to login using username.
   * @method _loginWithUsername
   * @access private
   */
  _loginWithUsername : function(username) {
    // controlSignin.updateDisplay(STATE_LOADING_LOGIN);

    var that = this, params = {
      username : username,
      password : that._selectorMap.password.val(),
      appId : 'pryv-web-access'
    }, url = '';

    url = 'https://' + username + '.' + this._data.domain + '/admin/login';

    PrYvUtil.XHR({
      url : url,
      context : that,
      params : params,
      success : that._onSuccessLoginWithUsername,
      error : that._onFailureLoginWithUsername
    });
  },

  /**
   * Method to handle if login with username is success.
   * @method _onSuccessLoginWithUsername
   * @access private
   * @param object response
   */
  _onSuccessLoginWithUsername : function(response, that)  {
    if(response.sessionID)  {
      that._data.sessionID = response.sessionID;
      that._data.username = that._selectorMap.userOrLogin.val();
      that._data.lang = response.preferredLanguage || that._data.lang;
      that._checkAppAccess()
              // controlSignin.checkAppAccess();
    } else if(response.id === 'invalid-credentials') {
      that._selectorMap.loginUsernameOrEmailCheck.css('display', 'block');
      that._selectorMap.loginUsernameOrEmailCheck.html(SIGNIN_MESSAGES['INVALID_CREDENTIALS']);
    } else  {
      that._errorHandler({ id : 'INTERNAL_ERROR', message : 'No sessionID found in response' });
    }
  },

  /**
   * Method to handle if login with username fails.
   * @method _onFailureLoginWithUsername
   * @access private
   * @param object response
   */
  _onFailureLoginWithUsername : function(response, that)  {
    if(response.xhr && response.xhr.status == 0)  {
      that._selectorMap.loginUsernameOrEmailCheck.css('display','block');
      that._selectorMap.loginUsernameOrEmailCheck.html(SIGNIN_MESSAGES['UNKOWN_USERNAME']);
    } else  {
      that._errorHandler(response);
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

      PrYvUtil.XHR({
        url: url,
        type : 'GET',
        context : that,
        success : that._onSuccessLoginWithEmail,
        error : that._onFailureLoginWithEmail
      });

  },

  /**
   * Method to handle if login with email is success.
   * @method _onSuccessLoginWithEmail
   * @access private
   * @param object response
   */
  _onSuccessLoginWithEmail : function(response, that) {
    if (response.uid) {
      that._loginWithUsername(response.uid);
    } else if (response.id == 'UNKOWN_EMAIL') {
      that._selectorMap.loginUsernameOrEmailCheck.css('display','block');
      that._selectorMap.loginUsernameOrEmailCheck.html(SIGNIN_MESSAGES['UNKOWN_EMAIL']);
    } else if (response.id) {
      that._errorHandler(jsonError)
    } else {
      that._errorHandler({ message : "loginWithEmail invalid data", detail : JSON.stringify(response), id : 'INTERNAL_ERROR' });
    }
  },

  /**
   * Method to handle if login with email fails.
   * @method _onFailureLoginWithEmail
   * @access private
   */
   _onFailureLoginWithEmail : function(response, that)  {
      that._errorHandler();
   },

  /**
   * Method to handle all errors.
   * @method _errorHandler
   * @access private
   * @param object error
   */
  _errorHandler : function(error, that) {
    that = that || this;

    that._data.lastState = error;
    if(that._data.key && (error.id != 'INVALID_KEY')) {
      that._sendState(error, null, function() {}); 
    }else {
      alert('ERROR: ' + JSON.stringify(error));
    }

    that._close();
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

    if(this._data.serverRelayIsOn)  {
      var url = this._data.registerURL + '/access/' + this._data.key;

      PrYvUtil.XHR({
        url : url,
        type : 'POST',
        async : false,
        context : that,
        params : state,
        success : callback,
        error : callbackError 
      })
    }

    if(this._data.windowMessagingIsOn)  {
      try {
        window.opener.postMessage(state,'*');
      }catch(error) { console.log('Failed communicating with opener.'); }
    }
  },

  /**
   * Method to close window.
   * @method _close
   * @access private
   */
  _close : function() {
    if(this._data.closing)  return;

    this._data.closing = true;
    if(this._data.returnURL)  {
      var nextURL = this._data.returnURL + 'prYvkey=' + this._data.key,
        params = this._data.lastState;

      for(var key in params)  {
        if(params.hasOwnProperty(key))  {
          nextURL += '&prYv' + key + '=' + encodeURIComponent(params[key]);
        }
      }

      location.href = nextURL;
    } else  {
      window.close();
    }
  },

  /**
   * Method to get the prefered language for the ui.
   * @method _getPreferedLanguage
   * @access private
   * @param string language
   * @return string
   */
  _getPreferedLanguage : function(language) {

    if(language)  {
      if(this._data.uiSupportedLanguages.indexOf(language) >= 0) return language;
    }

    var localization = this._data.uiSupportedLanguages[0];

    if(navigator.language)  {
      localization = navigator.language.toLowerCase().substring(0,2);
    } else if(navigator.userLanguage) {
      localization = navigator.userLanguage.toLowerCase().substring(0, 2);
    } else if(navigator.userAgent.indexOf('[') != -1) {
      var start = navigator.userAgent.indexOf('['),
        end = navigator.userAgent.indexOf(']');

      localization = navigator.userAgent.substring(start + 1, end).toLowerCase();
    }

    return localization;
  },

  /**
   * Method to check application access.
   * @method _checkAppAccess
   * @acces private
   */
  _checkAppAccess : function()  {
    this._updateDisplay(this._const.STATE_LOADING_CHECK_APP_ACCESS);
    var that = this,
      url = 'https://' + this._data.username + '.' + this._data.domain + '/admin/accesses/check-app',
      params = {
        requestingAppId : this._data.requestingAppId,
        requestedPermissions : this._data.requestedPermissions,
      };

    PrYvUtil.XHR({
      url : url,
      params : params,
      context : that,
      headers : { authorization : this._data.sessionID },
      success : that._onSuccessCheckAppAccess,
      error : that._onFailureCheckAppAccess 
    });
  },

  /**
   * Method to handel the success for the check app access.
   * @method _onSuccessCheckAppAccess
   * @access private
   * @param object response
   */
  _onSuccessCheckAppAccess : function(response, that)  {
    if(response.checkedPermissions) {
      that._data.checkedPermissions = response.checkedPermissions;
      that._data.mismatchingAccessToken = response.mismatchingAccessToken;
      that._updateDisplay()
    } else if(response.matchingAccessToken)  {
      that._success(response.matchingAccessToken);
    } else if(response.id)  {
      that._errorHandler(response);
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
  _onFailureCheckAppAccess : function()  {
    this._errorHandler();
  },

  /**
   * Method to handle the succes from the checking application access and 
   * post accessing.
   * @method _success
   * @access private
   * @param string token
   */
  _success : function(token) {
    this._data.token = token;

    var that = this, newState = {
      status : 'ACCEPTED',
      username : that._data.username,
      token : that._data.token,
      lang : this._data.lang
    }

    this._sendState(newState, this._updateDisplay);
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
    if(state == that._const.STATE_LOADING_CHECK_APP_ACCESS) return that._switchView('loadingPage');
    if(that._data.token)  return that._close();
    if(that._data.stateRefused) return that._close();
    if(that._data.sessionID && that._data.username && that._data.checkedPermissions)  {
      that._selectorMap.usernameDisplay.html(that._data.username);
      // that._selectorMap.accessRequstDisplay.val(JSON.stringify(this._data.checkedPermissions));
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
      statments = {

        folder : {
          /* Default Name means the server has created the channel/folder. */
          defaultName : {
            manage : "<li> - create the '#' folder and add content to it. </li>",
            read : "<li> - create the '#' folder and access the data in it. </li>",
            write : "<li> - create the '#' folder and add content to it. </li>"  
          },

          /* Name means the channel/folder already exists and has this name. */
          name : {
            manage : "<li> - add content to the '#' folder. </li>",
            read : "<li> - access the data in the '#' folder. </li>",
            write : "<li> - add content to the '#' folder. </li>"
          }
        },

        channel : {
          /* Default Name means the server has created the channel/folder. */
          defaultName : {
            manage : "<li> - create this channel and add content to it. </li>",
            read : "<li> - create this channel and access the data in it. </li>",
            write : "<li> - create this channel and add content to it. </li>"  
          },

          /* Name means the channel/folder already exists and has this name. */
          name : {
            manage : "<li> - add content to this channel. </li>",
            read : "<li> - access the data in this channel. </li>",
            write : "<li> - add content to this channel. </li>"
          }
        }
      }, that = this;

    that._selectorMap.permissionContentsWrapper.html('');

    checkedPermissions.forEach(function(permission) {
      var folderName = '', 
          ol = '',
          tempName = permission.hasOwnProperty('defaultName') ? 'defaultName' : 'name';

      htmlBlock = that._templateBlender(that._permissionWrapperTpl);
      ol = htmlBlock.find('ol');

      htmlBlock.find('h2').append( permission[tempName] + ' Channel');
      ol.append($( statments.channel[tempName][permission.level] ));
      
      if (permission.folderPermissions)
      permission.folderPermissions.forEach(function(folder) {

        if(folder.hasOwnProperty('name')) {
          folderName = statments.folder.name[folder.level].replace('#', folder.name);
        }else {
          folderName = statments.folder.defaultName[folder.level].replace('#', folder.defaultName);
        }

        ol.append($(folderName));
      });

      that._selectorMap.permissionContentsWrapper.append(htmlBlock);
    });
  },

  /**
   * Method to switch between the wrappers in authenication page.
   * @method _switchView
   * @access private
   * @param string page
   */
  _switchView : function(viewName)  {
    this._views.forEach(function(view) {
      document.getElementById(view).style.display = (view == viewName) ? 'block' : 'none';
    });
  },

  /**
   * Method to handle validate and access the permissions requested by the app.
   * @method _accessValidateButtonPressed
   * @access private
   */
  _accessValidateButtonPressed : function() {
    if (this._data.mismatchingAccessToken) {
      this._deleteMissmatchingToken(this._postAccess);
    } else {
      this._postAccess();
    }
  },

  /**
   * Method to handle when user refuses app to get access to his folder.
   * @method _accessRefuseButtonPressed
   * @access private
   */ 
  _accessRefuseButtonPressed : function() {
    this._refused('REFUSED_BY_USER','access refused by user');
  },

  /**
   * Method to delete Missmatching Token from the server.
   * @method _deleteMissmatchingToken
   * @access private
   * @param
   */
  _deleteMissmatchingToken : function(next) {
    var that = this,
      url = 'https://' + this._data.username + '.' + this._data.domain + '/admin/accesses/' + this._data.mismatchingAccessToken;

    PrYvUtil.XHR({
      url : url,
      type : 'DELETE',
      headers : { authorization : this._data.sessionID },
      context : that,
      success : function(data,xhr) {
        if (xhr.status != 200) {
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
  _postAccess : function() {
    var params = {
      name : this._data.requestingAppId,
      permissions : this._data.checkedPermissions,
      type : 'app'
    }, url = 'https://' + this._data.username + '.' + this._data.domain + '/admin/accesses',
    that = this;

    PrYvUtil.XHR({
      url : url,
      headers : { authorization : that._data.sessionID },
      params : params,
      type : 'POST',
      success : function(data)  {
        if(!data.token) {
          return that._errorHandler({
            message : 'Failed get-app-token',
            detail : 'postAccess data' + JSON.stringify(data),
            id : "INTERNAL_ERROR"
          });
        }

        that._success(data.token);
      },
      errors : that._errorHandler
    });
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
    this._sendState({
      status: 'REFUSED', 
      reasonID: reasonId,  
      message: message
    }, this._updateDisplay, this._updateDisplay);
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
      this._switchView('registration-form-wrapper');
    }else {
      this._switchView('login-form-wrapper');
    }
  },

  /**
   * Method to handle alert.
   * @method _alertHandler
   * @access private
   * @param string provoker
   */
  _alertHandler : function(provoker)  {
    var provokerMessagesBase = {
          'registerUrl' : 'Badly formatted register URL!!',
          'queryStringMalstructured' : 'Malstructured Query String. Required parameters missing, check the URL!!',
          'default' : 'Internal Error!!'
        }, 
        provokerMessage = '',
        prefix = 'ERROR# ';

    if(provokerMessagesBase.hasOwnProperty(provoker)) {
      provokerMessage = prefix + provokerMessagesBase[provoker];
    }else {
      provokerMessage = prefix + provokerMessagesBase.default;
    }

    alert(provokerMessage);
  }
  
};

/**
 * Utility belt module custom made for PrYv.
 * @module PrYvUtil
 */
var PrYvUtil = {

  /**
   * Method to handel the XMLHttpRequest.
   * @method XHR
   * @access public
   * @param object pack
   */
  XHR : function(pack)  {
    var xhr = null;

    if(!pack.hasOwnProperty("async")) {
      pack.async = true;
    }

    pack.type = pack.type || 'POST';
    pack.headers = pack.headers || {};
    pack.headers['Content-Type'] = pack.headers['Content-Type'] || "application/json; charset=utf-8";
    if (pack.type == 'POST') { pack.params = pack.params || {}; }

    
    xhr = this._initXHR();
    xhr.open(pack.type, pack.url, pack.async);
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 0) {
        pack.error({message: "pryvXHRCall unsent", detail: "", id: "INTERNAL_ERROR", xhr: xhr}, pack.context);
      } else if (xhr.readyState == 4) {

        var result = null; 

        try { result = JSON.parse(xhr.responseText); } 
          catch (e) {
            return pack.error({message: "Data is not JSON", detail: xhr.statusText, id: "RESULT_NOT_JSON", xhr: xhr}, pack.context);
          };

        pack.success(result,pack.context,xhr);
      }
    };

    for(var key in pack.headers){
      if (pack.headers.hasOwnProperty(key))
        xhr.setRequestHeader(key, pack.headers[key]);
    }

    xhr.withCredentials = true;
  
    try { xhr.send(JSON.stringify(pack.params)); } 
      catch (e) {
        pack.error({message: "pryvXHRCall unsent", detail: "", id: "INTERNAL_ERROR", error: e}, pack.context);
      };  

    return xhr;
  },

  /**
   * Method to initialize XMLHttpRequest.
   * @method _initXHR
   * @access private
   * @return object
   */
  _initXHR : function() {
    var XHR = null;

    try { XHR = new XMLHttpRequest(); } 
    catch(e) { 
      try { XHR = new ActiveXObject("Msxml2.XMLHTTP"); } 
      catch (e2) {  
        try { XHR = new ActiveXObject("Microsoft.XMLHTTP"); } 
        catch (e3) { ; 
          console.log('XMLHttpRequest implementation not found.');
        };
        console.log('XMLHttpRequest implementation not found.'); 
      };
      console.log('XMLHttpRequest implementation not found.');
    }

    return XHR;
  }

};