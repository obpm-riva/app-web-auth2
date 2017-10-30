
// leave the first blank line for script concatenation by cat

var Pryv = Pryv || {};

var PryvCustomization = {
  serviceName : 'Pryv',
  registrationUrl : 'http://pryv.com/register',
  termsOfUseUrl : 'http://pryv.com/terms-of-use/',
  privacyUrl : 'http://pryv.com/privacy/'
};

//--------------------- Pryv.Access ----------//
Pryv.Access = {
  config: {
    registerURL: 'https://bogus',  // to be changed on init
    reclaDevel : false,
    sdkFullPath: 'bogus3', // to be changed on _init
    sdkAccessPath: '/access/SDK-VERSION-NUM'
  },
  state: null,  // actual state
  window: null,  // popup window reference (if any)
  spanButton: null, // an element on the app web page that can be controlled
  buttonHTML: '',
  settings: null,
  pollingID: false,
  pollingIsOn: true, //may be turned off if we can communicate between windows
  cookieEnabled: false,
  ignoreStateFromURL: false // turned to true in case of loggout
};

/**
 * Method to initialize the data required for authorization.
 * @method _init
 * @access private
 */
Pryv.Access._init = function (i) {

  // FULL PATH IS EXTARCTED FROM LOCATION
  var pathArray = location.href.split( '/' );
  var protocol = pathArray[0];
  var host = pathArray[2];
  this.config.sdkFullPath = protocol + '//' + host + '/' + this.config.sdkAccessPath;

  // start only if Pryv.Utility is loaded
  if (typeof Pryv.Utility === 'undefined') {
    if (i > 100) {
      throw new Error('Cannot find Pryv.Utility');
    }
    i++;
    return setTimeout('Pryv.Access._init(' + i + ')', 10 * i);
  }

  Pryv.Utility.loadExternalFiles(
    this.config.sdkFullPath + '/media/styles/buttonSigninPryv.css', 'css');


  console.log('init done');
};


Pryv.Access._init(1);

//--------------------- UI Content -----------//


Pryv.Access.uiSupportedLanguages = ['en', 'fr'];

Pryv.Access.uiButton = function (onClick, buttonText) {
  if (Pryv.Utility.supportCSS3()) {
    return '<div class="pryv-access-btn-signin" onclick="' + onClick + '">' +
      '<a class="pryv-access-btn pryv-access-btn-pryv-access-color" href="#">' +
      '<span class="logoSignin">Y</span></a>' +
      '<a class="pryv-access-btn pryv-access-btn-pryv-access-color"  href="#"><span>' +
      buttonText + '</span></a></div>';
  } else   {
    return '<a href="#" onclick="' + onClick +
      '" class="pryv-access-btn-signinImage" ' +
      'src="' + this.config.sdkFullPath + 'images/btnSignIn.png" >' + buttonText + '</a>';
  }
};

Pryv.Access.uiErrorButton = function () {
  var strs = {
    'en': { 'msg': 'Error :(' },
    'fr': { 'msg': 'Erreur :('}
  }[this.settings.languageCode];

  return Pryv.Access.uiButton('Pryv.Access.logout(); return false;', strs.msg);

};

Pryv.Access.uiLoadingButton = function () {
  var strs = {
    'en': { 'msg': 'Loading ...' },
    'fr': { 'msg': 'Chargement ...'}
  }[this.settings.languageCode];

  return Pryv.Access.uiButton('return false;', strs.msg);

};

Pryv.Access.uiSigninButton = function () {
  var strs = {
    'en': { 'msg': PryvCustomization.serviceName + ' sign-in' },
    'fr': { 'msg': 'Connection à ' + PryvCustomization.serviceName}
  }[this.settings.languageCode];

  return Pryv.Access.uiButton('Pryv.Access.popupLogin(); return false;', strs.msg);

};

Pryv.Access.uiConfirmLogout = function () {
  var strs = {
    'en': { 'logout': 'Logout ?'},
    'fr': { 'logout': 'Se déconnecter?'}
  }[this.settings.languageCode];

  if (confirm(strs.logout)) {
    Pryv.Access.logout();
  }
};

Pryv.Access.uiInButton = function(username) {
  return Pryv.Access.uiButton('Pryv.Access.uiConfirmLogout(); return false;', username);
};

Pryv.Access.uiRefusedButton = function(message) {
  console.log('Pryv Access [REFUSED]' + message)
  var strs = {
    'en': { 'msg': 'Access refused'},
    'fr': { 'msg': 'Accès refusé'}
  }[this.settings.languageCode];

  return Pryv.Access.uiButton('Pryv.Access.retry(); return false;', strs.msg);

};

//--------------- end of UI ------------------//


Pryv.Access.updateButton = function (html) {
  this.buttonHTML = html;
  if (! this.settings.spanButtonID) { return; }

  Pryv.Utility.domReady(function () {
    if (! Pryv.Access.spanButton) {
      var element = document.getElementById(Pryv.Access.settings.spanButtonID);
      if (typeof(element) === 'undefined' || element === null) {
        throw new Error('Pryv.Access-SDK cannot find span ID: "' +
          Pryv.Access.settings.spanButtonID + '"');
      } else {
        Pryv.Access.spanButton = element;
      }
    }
    Pryv.Access.spanButton.innerHTML = Pryv.Access.buttonHTML;

  });
};

Pryv.Access.internalError = function (message, jsonData) {
  Pryv.Access.stateChanged({id: 'INTERNAL_ERROR', message: message, data: jsonData});
};

//STATE HUB
Pryv.Access.stateChanged  = function(data) {
  if (data.id) { // error
    this.settings.callbacks.error(data.id,data.message);
    this.updateButton(this.uiErrorButton());
    console.log('Error: '+JSON.stringify(data));
    // this.logout();   Why should I retry if it failed already once?
  }

  if (data.status === this.state.status) {
    return ;
  }
  if (data.status === 'LOADED') { // skip
    return ;
  }
  if (data.status === 'POPUPINIT') { // skip
    return ;
  }

  this.state = data;
  if (this.state.status === 'NEED_SIGNIN') {
    this.stateNeedSignin();
  }
  if (this.state.status === 'REFUSED') {
    this.stateRefused();
  }

  if (this.state.status === 'ACCEPTED') {
    this.stateAccepted();
  }

};

//STATE 0 Init
Pryv.Access.stateInitialization = function() {
  this.state = {"status" : "initialization"};
  this.updateButton(this.uiLoadingButton());
  this.settings.callbacks.initialization();
};

//STATE 1 Need Signin
Pryv.Access.stateNeedSignin = function() {
  this.updateButton(this.uiSigninButton());
  this.settings.callbacks.needSignin(this.state.url,this.state.poll,this.state.poll_rate_ms);
};


//STATE 2 User logged in and authorized
Pryv.Access.stateAccepted = function() {
  if (this.cookieEnabled) {
    this.docCookies.setItem("Pryv.Access_username",this.state.username,3600);
    //this.docCookies.setItem("Pryv.Access_token",this.state.token,3600);
  }
  this.updateButton(this.uiInButton(this.state.username));
  this.settings.callbacks.accepted(this.state.username,this.state.token,this.state.lang);
};

//STATE 3 User refused
Pryv.Access.stateRefused = function() {
  this.updateButton(this.uiRefusedButton(this.state.message));
  this.settings.callbacks.refused('refused:'+this.state.message);
};


/**
 * clear all references
 */
Pryv.Access.logout = function() {
  this.ignoreStateFromURL = true;
  if (this.cookieEnabled) {
    this.docCookies.removeItem("Pryv.Access_username");
    this.docCookies.removeItem("Pryv.Access_token");
  }
  this.state = null;
  this.settings.callbacks.accepted(false,false,false);
  this.setup(this.settings);
};

/**
 * clear references and try again
 */
Pryv.Access.retry = Pryv.Access.logout ;


Pryv.Access.setup = function(settings) {
  this.state = null;
  //--- check the browser capabilities



  // cookies
  this.cookieEnabled = (navigator.cookieEnabled)? true : false;
  if (typeof navigator.cookieEnabled=="undefined" && !this.cookieEnabled){  //if not IE4+ nor NS6+
    document.cookie="testcookie";
    this.cookieEnabled= (document.cookie.indexOf("testcookie")!=-1) ? true : false;
  }

  //TODO check settings..

  settings.languageCode = Pryv.Utility.getPreferredLanguage(this.uiSupportedLanguages,settings.languageCode);

  //-- returnURL
  if (settings.returnURL) {
    // check the trailer
    var trailer = settings.returnURL.charAt(settings.returnURL.length - 1);
    if("#&?".indexOf(trailer) < 0) {
      throw new Error("Pryv access: Last character of --returnURL setting-- is not '?', '&' or '#': "+settings.returnURL);
    }

    // set self as return url?
    var returnself = (settings.returnURL.indexOf("self") === 0);
    if (settings.returnURL.indexOf("auto") === 0) {
      returnself = Pryv.Utility.browserIsMobileOrTablet();
      if (!returnself) settings.returnURL = false;
    }

    if (returnself) {
      var myParams = settings.returnURL.substring(4);
      // eventually clean-up current url from previous pryv returnURL
      settings.returnURL = this._cleanStatusFromURL() + myParams;
    }

    if (settings.returnURL) {
      if (settings.returnURL.indexOf("http") < 0) {
        throw new Error("Pryv access: --returnURL setting-- does not start with http: "+settings.returnURL);
      }
    }
  }

  //  spanButtonID is checked only when possible
  this.settings = settings;

  var params = {
    requestingAppId : settings.requestingAppId,
    requestedPermissions : settings.requestedPermissions,
    languageCode : settings.languageCode,
    returnURL : settings.returnURL
  };

  if (settings.oauthState) {
    params.oauthState = settings.oauthState;
  }

  if (Pryv.Access.config.reclaDevel) {
    // return url will be forced to https://se.rec.la + reclaDevel
    params.reclaDevel = Pryv.Access.config.reclaDevel;
  }

  this.stateInitialization();

  // look if we have a returning user (document.cookie)
  var cookieUserName = this.cookieEnabled ? this.docCookies.getItem("Pryv.Access_username") : false;
  var cookieToken = this.cookieEnabled ? this.docCookies.getItem("Pryv.Access_token") : false;

  // look in the URL if we are returning from a login process
  var stateFromURL =  this._getStatusFromURL();

  if (stateFromURL && (! this.ignoreStateFromURL)) {
    this.stateChanged(stateFromURL);
  } else if (cookieToken && cookieUserName) {
    this.stateChanged({status:"ACCEPTED", username: cookieUserName, token: cookieToken});
  } else { // launch process $

    Pryv.Utility.XHR({
      url : Pryv.Access.config.registerURL + '/access',
      params : params,
      success : function(data)  {
        if (data.status && data.status != 'ERROR') {
          Pryv.Access.stateChanged(data);
        } else {
          // TODO call shouldn't failed
          Pryv.Access.internalError("/access Invalid data: ",data);
        }
      },
      error : function(jsonError) {
        Pryv.Access.internalError("/access ajax call failed: ",jsonError);
      }
    });

  }
  return true;
};

//logout the user if

//read the polling
Pryv.Access.poll = function poll() {
  if (this.pollingIsOn && this.state.poll_rate_ms) {
    // remove eventually waiting poll..
    if (this.pollingID) { clearTimeout(this.pollingID); }

    Pryv.Utility.XHR({
      url : Pryv.Access.config.registerURL + '/access/' + Pryv.Access.state.key,
      type : 'GET',
      success : function(data)  {
        Pryv.Access.stateChanged(data);
      },
      error : function(jsonError) {
        Pryv.Access.internalError("poll failed: ",jsonError);
      }
    });

    this.pollingID = setTimeout("Pryv.Access.poll()",this.state.poll_rate_ms);
  } else {
    console.log("stopped polling: on="+this.pollingIsOn+" rate:"+this.state.poll_rate_ms);
  }
};


//messaging between browser window and window.opener
Pryv.Access.popupCallBack = function(event) {
  // Do not use 'this' here !
  if (Pryv.Access.settings.forcePolling) { return; }
  if (event.source !== Pryv.Access.window) {
    console.log("popupCallBack event.source does not match Pryv.Access.window");
    return false;
  }
  console.log("from popup >>> "+JSON.stringify(event.data));
  Pryv.Access.pollingIsOn = false; // if we can receive messages we stop polling
  Pryv.Access.stateChanged(event.data);
};



Pryv.Access.popupLogin = function popupLogin() {
  if ((! this.state) || (! this.state.url )) {
    throw new Error("Pryv Sign-In Error: NO SETUP. Please call Pryv.Access.setup() first.");
  }

  if (this.settings.returnURL) {
    location.href = this.state.url;
    return;
  }

  // start polling
  setTimeout("Pryv.Access.poll()",1000);

  var screenX = typeof window.screenX != 'undefined' ? window.screenX : window.screenLeft,
    screenY = typeof window.screenY != 'undefined' ? window.screenY : window.screenTop,
    outerWidth = typeof window.outerWidth != 'undefined' ? window.outerWidth : document.body.clientWidth,
    outerHeight = typeof window.outerHeight != 'undefined' ? window.outerHeight : (document.body.clientHeight - 22),
    width    = 270,
    height   = 420,
    left     = parseInt(screenX + ((outerWidth - width) / 2), 10),
    top      = parseInt(screenY + ((outerHeight - height) / 2.5), 10),
    features = (
      'width=' + width +
        ',height=' + height +
        ',left=' + left +
        ',top=' + top +
        ',scrollbars=yes'
      );


  window.addEventListener("message", Pryv.Access.popupCallBack, false);

  this.window = window.open(this.state.url,'prYv Sign-in',features);

  if (! this.window) {
    // TODO try to fall back on Pryv.Access
    callback({status: 'FAILED_TO_OPEN_WINDOW'});
  } else {
    if (window.focus) {
      this.window.focus() ;
    }
  }

  return false;
};

//-------------------- UTILS ---------------------//
/*\
 |*|
 |*|  :: cookies.js ::
 |*|
 |*|  A complete cookies reader/writer framework with full unicode support.
 |*|
 |*|  https://developer.mozilla.org/en-US/docs/DOM/document.cookie
 |*|
 |*|  Syntaxes:
 |*|
 |*|  * docCookies.setItem(name, value[, end[, path[, domain[, secure]]]])
 |*|  * docCookies.getItem(name)
 |*|  * docCookies.removeItem(name[, path])
 |*|  * docCookies.hasItem(name)
 |*|  * docCookies.keys()
 |*|
 \*/
Pryv.Access.docCookies = {
  getItem: function (sKey) {
    if (!sKey || !this.hasItem(sKey)) { return null; }
    return unescape(document.cookie.replace(new RegExp("(?:^|.*;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*"), "$1"));
  },
  setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
    if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return; }
    var sExpires = "";
    if (vEnd) {
      switch (vEnd.constructor) {
        case Number:
          sExpires = vEnd === Infinity ? "; expires=Tue, 19 Jan 2038 03:14:07 GMT" : "; max-age=" + vEnd;
          break;
        case String:
          sExpires = "; expires=" + vEnd;
          break;
        case Date:
          sExpires = "; expires=" + vEnd.toGMTString();
          break;
      }
    }
    document.cookie = escape(sKey) + "=" + escape(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
  },
  removeItem: function (sKey, sPath) {
    if (!sKey || !this.hasItem(sKey)) { return; }
    document.cookie = escape(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sPath ? "; path=" + sPath : "");
  },
  hasItem: function (sKey) {
    return (new RegExp("(?:^|;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
  },
  keys: /* optional method: you can safely remove it! */ function () {
    var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
    for (var nIdx = 0; nIdx < aKeys.length; nIdx++) { aKeys[nIdx] = unescape(aKeys[nIdx]); }
    return aKeys;
  }
};

//util to grab parameters from url query string
Pryv.Access._getStatusFromURL = function() {
  var vars = {};
  var parts = window.location.href.replace(/[?#&]+prYv([^=&]+)=([^&]*)/gi,
    function(m, key, value) {
      vars[key] = value;
    });

  //TODO check validiy of status

  return (vars.key) ? vars : false;
};

//util to grab parameters from url query string
Pryv.Access._cleanStatusFromURL = function() {
  return window.location.href.replace(/[?#&]+prYv([^=&]+)=([^&]*)/gi,"");
};



