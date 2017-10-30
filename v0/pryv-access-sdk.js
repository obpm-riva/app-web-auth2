/**
 * Method to check the browser supports CSS3.
 * @method supportCSS3
 * @access public
 * @return boolean
 */
var supportCSS3 = function()  {
  var stub = document.createElement('div'),
      browserImplementation = ['Webkit', 'Moz' , 'O', 'Ms', 'Khtml'],
      testProperty = 'textShadow',
      browsersRegistered = browserImplementation.length;
  
      if ( testProperty in stub.style ) return true;
 
      testProperty = testProperty.replace(/^[a-z]/, function(val) {
         return val.toUpperCase();
      });
 
      while(browsersRegistered--) {
         if ( vendors[browsersRegistered] + testProperty in stub.style ) {
            return true;
         } 
      }
      return false;
}

/**
 * Method to load external files like javascript and stylesheet. this version
 * of method only support to file types - js|javascript and css|stylesheet.
 * @method loadExternalFiles
 * @access public
 * @param string filename
 * @param string type
 */ 
var loadExternalFiles = function(filename, type)  {
  var tag = null;

  type = type.toLowerCase();

  if(type === 'js' || type === 'javascript') {
    tag = document.createElement('script');
    tag.setAttribute("type","text/javascript");
    tag.setAttribute("src", filename);
  }else if(type === 'css' || type === 'stylesheet')  {
    tag = document.createElement('link');
    tag.setAttribute("rel", "stylesheet");
    tag.setAttribute("type", "text/css");
    tag.setAttribute("href", filename);
  }

  if(tag !== null || tag !== undefined) {
    document.getElementsByTagName('head')[0].appendChild(tag);
  }
}


//--------------------- pryvAccess ----------//

var pryvAccess = {
    config: {
      registerURL: 'https://reg.rec.la', 
      localDevel : false,
      sdkFullPath: 'https://sw.rec.la/access/v0'},
    state: null,  // actual state
    window: null,  // popup window reference (if any)
    spanButton: null, // an element on the app web page that can be controlled
    buttonHTML: "",
    settings: null,
    pollingID: false,
    pollingIsOn: true, //may be turned off if we can communicate between windows
    cookieEnabled: false,
    ignoreStateFromURL: false // turned to true in case of loggout
};


//--------------------- UI Content -----------//


pryvAccess.uiSupportedLanguages = ["en","fr"];

pryvAccess.uiButton = function(onClick,buttonText) {
  console.log(onClick,buttonText);
  if(supportCSS3()) {
    return '<div class="pryv-access-btn-signin" onclick="'+onClick+'"><a class="pryv-access-btn pryv-access-btn-pryv-access-color" href="#"><span class="logoSignin">Y</span></a><a class="pryv-access-btn pryv-access-btn-pryv-access-color"  href="#"><span>'+buttonText+'</span></a></div>';
  } else   {
    return '<a href="#" onclick="'+onClick+'" class="pryv-access-btn-signinImage" src="'+this.config.sdkFullPath+'images/btnSignIn.png" >'+buttonText+'</a>';  
  }
};



pryvAccess.uiSigninButton = function() {
  var strs = { 
      "en": { "msg": "PrYv Sign-In" },
      "fr": { "msg": "Connection à PrYv"} }[this.settings.languageCode];
  
  return pryvAccess.uiButton("pryvAccess.popupLogin(); return false;", strs["msg"]);

};

pryvAccess.uiConfirmLogout = function() {
  var strs = { 
      "en": { "logout": "Logout ?"},
      "fr": { "logout": "Se déconnecter?"}}[this.settings.languageCode];
  
  if (confirm(strs["logout"])) { 
    pryvAccess.logout();
  }
};

pryvAccess.uiInButton = function(username) {
  return pryvAccess.uiButton("pryvAccess.uiConfirmLogout(); return false;", username);
};

pryvAccess.uiRefusedButton = function(message) {
  var strsLocales = { 
      "en": { "msg": "Access refused"},
      "fr": { "msg": "Accès refusé"}}[this.settings.languageCode];

  return pryvAccess.uiButton("pryvAccess.retry(); return false;", strs["msg"]);

};

//--------------- end of UI ------------------//


pryvAccess.updateButton = function(html) {  
  this.buttonHTML = html;
  if (! this.settings.spanButtonID) return; 

  domready(function() {
    if (! pryvAccess.spanButton) {
      var element = document.getElementById(pryvAccess.settings.spanButtonID);
      if (typeof(element) == "undefined" || element == null) {
        throw new Error("PryvAccess-SDK cannot find span ID: '"+pryvAccess.settings.spanButtonID+"'");
      } else {
        pryvAccess.spanButton = element;
      };
    };
    pryvAccess.spanButton.innerHTML = pryvAccess.buttonHTML;
  });
};

pryvAccess.internalError = function(message) {
  console.log("ERROR: "+message);
};

//STATE HUB
pryvAccess.stateChanged  = function(data) {
  if (data.id) { // error
    this.settings.callbacks.error(data.id,data.message);
    console.log("Error: "+JSON.stringify(data));
    this.logout();
  } 

  if (data.status == this.state.status) {
    return ;
  }
  if (data.status == "LOADED") { // skip
    return ;
  }

  this.state = data;
  if (this.state.status == "NEED_SIGNIN") {
    this.stateNeedSignin();
  }
  if (this.state.status == "REFUSED") {
    this.stateRefused();
  }

  if (this.state.status == "ACCEPTED") {
    this.stateAccepted();
  }

};

//STATE 0 Init
pryvAccess.stateInitialization = function() {
  this.state = {"status" : "initialization"};
  this.updateButton("Loading...");
  this.settings.callbacks.initialization();
};

//STATE 1 Need Signin
pryvAccess.stateNeedSignin = function() {
  this.updateButton(this.uiSigninButton());
  this.settings.callbacks.needSignin(this.state.url,this.state.poll,this.state.poll_rate_ms);
};


//STATE 2 User logged in and authorized
pryvAccess.stateAccepted = function() {
  if (this.cookieEnabled) {
    this.docCookies.setItem("pryvAccess_username",this.state.username,3600);
    this.docCookies.setItem("pryvAccess_token",this.state.token,3600);
  }
  this.updateButton(this.uiInButton(this.state.username));
  this.settings.callbacks.accepted(this.state.username,this.state.token,this.state.lang);
};

//STATE 3 User refused
pryvAccess.stateRefused = function() {
  this.updateButton(this.uiRefusedButton(this.state.message));
  this.settings.callbacks.refused('refused:'+this.state.message);
};


/**
 * clear all references
 */
pryvAccess.logout = function() {
  this.ignoreStateFromURL = true;
  if (this.cookieEnabled) {
    this.docCookies.removeItem("pryvAccess_username");
    this.docCookies.removeItem("pryvAccess_token");
  }
  this.state = null;
  this.settings.callbacks.accepted(false,false,false);
  this.setup(this.settings);
};

/**
 * clear references and try again
 */
pryvAccess.retry = pryvAccess.logout ;


pryvAccess.setup = function(settings) { 
  this.state = null;
  //--- check the browser capabilities

  /* Loading External files. */
  loadExternalFiles(this.config.sdkFullPath+'/media/styles/buttonSigninPryv.css', 'css');

  // cookies
  this.cookieEnabled = (navigator.cookieEnabled)? true : false;
  if (typeof navigator.cookieEnabled=="undefined" && !this.cookieEnabled){  //if not IE4+ nor NS6+
    document.cookie="testcookie";
    this.cookieEnabled= (document.cookie.indexOf("testcookie")!=-1) ? true : false;
  }

  //TODO check settings.. 

  settings.languageCode = this._getPreferedLanguage(settings.languageCode);

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
      returnself = this._browserIsMobileOrTablet();
      if (!returnself) settings.returnURL = false;
    } 

    if (returnself) {
      var params = settings.returnURL.substring(4);
      // eventually clean-up current url from previous pryv returnURL
      settings.returnURL = this._cleanStatusFromURL()+params;
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
      returnURL : settings.returnURL };

  if (pryvAccess.config.localDevel) {
    // return url will be forced to https://l.rec.la:4443/access.html
    params.localDevel = pryvAccess.config.localDevel;
  }

  this.stateInitialization();

  // look if we have a returning user (document.cookie)
  var cookieUserName = this.cookieEnabled ? this.docCookies.getItem("pryvAccess_username") : false;
  var cookieToken = this.cookieEnabled ? this.docCookies.getItem("pryvAccess_token") : false;

  // look in the URL if we are returning from a login process
  var stateFromURL =  this._getStatusFromURL();

  if (stateFromURL && (! this.ignoreStateFromURL)) {
    this.stateChanged(stateFromURL);
  } else if (cookieToken && cookieUserName) {
    this.stateChanged({status:"ACCEPTED", username: cookieUserName, token: cookieToken});
  } else { // launch process $

    pryvAjaxCall({
      url: pryvAccess.config.registerURL+'/access',
      params: params,
      success: function(data) {
        if (data.status && data.status != 'ERROR') { 
          pryvAccess.stateChanged(data);
        } else {
          // TODO call shouldn't failed
          pryvAccess.internalError("/access Invalid data: "+JSON.stringify(data));
        }
      },
      error: function (jsonError) {
        pryvAccess.internalError("/access ajax call failed: "+JSON.stringify(jsonError));
      }
    });
  }
  return true;
};

//logout the user if 

//read the polling 
pryvAccess.poll = function poll() {
  if (this.pollingIsOn && this.state.poll_rate_ms) {
    // remove eventually waiting poll.. 
    if (this.pollingID) { clearTimeout(this.pollingID); }

    pryvAjaxCall({
      url: pryvAccess.config.registerURL+'/access/'+pryvAccess.state.key,
      type: 'GET',
      success: function(data) {
        pryvAccess.stateChanged(data);
      },
      error: function (jsonError) {
        pryvAccess.internalError("poll failed: "+JSON.stringify(jsonError));
      }
    });

    this.pollingID = setTimeout("pryvAccess.poll()",this.state.poll_rate_ms);
  } else {
    console.log("stopped polling: on="+this.pollingIsOn+" rate:"+this.state.poll_rate_ms);
  }
};


//messaging between browser window and window.opener
pryvAccess.popupCallBack = function(event) {
  // Do not use 'this' here !
  if (pryvAccess.settings.forcePolling) { return; }
  if (event.source !== pryvAccess.window) {
    console.log("popupCallBack event.source does not match pryvAccess.window");
    return false;
  }
  console.log("from popup >>> "+JSON.stringify(event.data));
  pryvAccess.pollingIsOn = false; // if we can receive messages we stop polling
  pryvAccess.stateChanged(event.data);
};



pryvAccess.popupLogin = function popupLogin() {
  if ((! this.state) || (! this.state.url )) {
    throw new Error("Pryv Sign-In Error: NO SETUP. Please call pryvAccess.setup() first.");
  }

  if (this.settings.returnURL) {
    location.href = this.state.url;
    return;
  }

  // start polling
  setTimeout("pryvAccess.poll()",1000);

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
                      ',top=' + top
                  );


  window.addEventListener("message", pryvAccess.popupCallBack, false);

  this.window = window.open(this.state.url,'prYv Sign-in',features);

  if (! this.window) {
    // TODO try to fall back on pryvAccess
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
pryvAccess.docCookies = {
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
pryvAccess._getStatusFromURL = function() {
  var vars = {};
  var parts = window.location.href.replace(/[?#&]+prYv([^=&]+)=([^&]*)/gi,
      function(m, key, value) {
    vars[key] = value;
  });
  
  //TODO check validiy of status
  
  return (vars.key) ? vars : false;
};

//util to grab parameters from url query string
pryvAccess._cleanStatusFromURL = function() {
  return window.location.href.replace(/[?#&]+prYv([^=&]+)=([^&]*)/gi,"");
};

//return true if browser is seen as a mobile or tablet
//list grabbed from https://github.com/codefuze/js-mobile-tablet-redirect/blob/master/mobile-redirect.js
pryvAccess._browserIsMobileOrTablet = function () {
  return (/iphone|ipod|android|blackberry|opera mini|opera mobi|skyfire|maemo|windows phone|palm|iemobile|symbian|symbianos|fennec|ipad|android 3|sch-i800|playbook|tablet|kindle|gt-p1000|sgh-t849|shw-m180s|a510|a511|a100|dell streak|silk/i.test(navigator.userAgent.toLowerCase()));
};

//get default language code
pryvAccess._getPreferedLanguage = function (desiredLanguage) {
  if (desiredLanguage) {
    if (this.uiSupportedLanguages.indexOf(desiredLanguage) >= 0) return desiredLanguage;
  }
  var lct = this.uiSupportedLanguages[0];
  if (navigator.language) {
    lct=navigator.language.toLowerCase().substring(0, 2);
  } else if (navigator.userLanguage) {
    lct=navigator.userLanguage.toLowerCase().substring(0, 2);
  } else if (navigator.userAgent.indexOf("[")!=-1) {
    var start=navigator.userAgent.indexOf("[");
    var end=navigator.userAgent.indexOf("]");
    lct=navigator.userAgent.substring(start+1, end).toLowerCase();
  }
  return lct;
};

//-------------------- AJAX  --------------------//

/**
 * http://www.w3.org/TR/XMLHttpRequest/
 * @return XMLHttpRequest object
 */
var pryvXHRCall = function(pack) {
  pack.type = pack.type || 'POST';
  pack.headers = pack.headers || {};
  pack.headers['Content-Type'] = pack.headers['Content-Type'] || "application/json; charset=utf-8";

  if (pack.type == 'POST') {
    pack.params = pack.params || {}; 
  }

  var xhr=null;
  try { xhr = new XMLHttpRequest(); } catch(e) { 
    try { xhr = new ActiveXObject("Msxml2.XMLHTTP"); } catch (e2) {  
      try { xhr = new ActiveXObject("Microsoft.XMLHTTP"); } catch (e3) { ; }; }; }

  xhr.open(pack.type, pack.url);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 0) {
      pack.error({message: "pryvXHRCall unsent", detail: "", id: "INTERNAL_ERROR", xhr: xhr});
    } else if (xhr.readyState == 4) {

      var result = null; 
      try {
        result = JSON.parse(xhr.responseText);
      } catch (e) {
        return pack.error({message: "Data is not JSON", detail: xhr.statusText, id: "RESULT_NOT_JSON", xhr: xhr});
      }
      pack.success(result,xhr);
    }
  };
  for(var key in pack.headers){
    if (pack.headers.hasOwnProperty(key))
      xhr.setRequestHeader(key, pack.headers[key]);
  }
  xhr.withCredentials = true;
  xhr.send(JSON.stringify(pack.params));
  return xhr;
};




var pryvAjaxCall = pryvXHRCall;




//----------- DomReady ----------//
/*!
 * domready (c) Dustin Diaz 2012 - License MIT
 */
!function (name, definition) {
  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
  else this[name] = definition()
}('domready', function (ready) {

  console.log("on dom ready");

  var fns = [], fn, f = false
  , doc = document
  , testEl = doc.documentElement
  , hack = testEl.doScroll
  , domContentLoaded = 'DOMContentLoaded'
    , addEventListener = 'addEventListener'
      , onreadystatechange = 'onreadystatechange'
        , readyState = 'readyState'
          , loaded = /^loade|c/.test(doc[readyState])

          function flush(f) {
    loaded = 1
    while (f = fns.shift()) f()
  }

  doc[addEventListener] && doc[addEventListener](domContentLoaded, fn = function () {
    doc.removeEventListener(domContentLoaded, fn, f)
    flush()
  }, f)


  hack && doc.attachEvent(onreadystatechange, fn = function () {
    if (/^c/.test(doc[readyState])) {
      doc.detachEvent(onreadystatechange, fn)
      flush()
    }
  })

  return (ready = hack ?
      function (fn) {
    self != top ?
        loaded ? fn() : fns.push(fn) :
          function () {
          try {
            testEl.doScroll('left')
          } catch (e) {
            return setTimeout(function() { ready(fn) }, 50)
          }
          fn()
        }()
  } :
    function (fn) {
    loaded ? fn() : fns.push(fn)
  })
})
