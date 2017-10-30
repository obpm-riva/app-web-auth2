console.log("cookies reading from controller:"+document.cookie);

//TODO remove jquery references





//config for register controller ..
var pryvConfig = {
    'LANGUAGE': 'en',
    'REGISTER_URL': null
};

//--------------------------------------------------------------------------//

/**
 * controler for signin window popup 
 * (index.html)
 */
var controlSignin = { 
    lastState: {},
    uiLanguage: null, preferredLanguage: null,
    key: null, pollURL: null, domain: null, registerURL: null, 
    returnURL: null, popupCallBack: null, access: null,
    username: null, sessionID: null, closing: false , token: null, 
    serverRelayIsOn: true, windowMessagingIsOn: true, stateRefused: false,
    requestedPermissions: null, requestingAppId: null, 
    checkedPermissions: null, mismatchingAccessToken: null};

controlSignin.uiSupportedLanguages = ["en","fr"];


controlSignin.init = function() {
  try { // try to communicate with opener in order to avoid polling
    window.opener.postMessage({status: "LOADED"},"*");
  } catch (e) {console.log("Popup CallBack NON-Functional");};

  var tempReturnURL = _urlParam('returnURL',false);
  controlSignin.returnURL = tempReturnURL ? decodeURIComponent(tempReturnURL) : false ;
  controlSignin.username = _urlParam('username',false);
  controlSignin.sessionID = _urlParam('sessionID',false);
  controlSignin.preferredLanguage = _urlParam('lang',true);
  controlSignin.domain = _urlParam('domain',true);
  controlSignin.key = _urlParam('key',true);
  controlSignin.requestingAppId = _urlParam('requestingAppId',true);
  controlSignin.registerURL = decodeURIComponent(_urlParam('registerURL',true));
  
  controlSignin.uiLanguage = controlSignin._getPreferedLanguage(controlSignin.preferredLanguage);
  
  
  if (! controlSignin.registerURL ) {
    controlSignin.error({message: "Badly formated registerURL", detail: "registerURL: "+registerURL, id: "INTERNAL_ERROR"}); 
  }

  var pollURLencoded = _urlParam('poll',false);
  if (pollURLencoded) { // need to get data from relay server
    controlSignin.pollURL = decodeURIComponent(pollURLencoded);
    pryvAjaxCall({
      url: controlSignin.pollURL,
      type: 'GET',
      success: function(data) {
        if (data.requestedPermissions) {
          controlSignin.requestedPermissions = data.requestedPermissions;
          controlSignin.updateDisplay();

        } else {
          controlSignin.error({id: 'INTERNAL_ERROR', message: 'invalid data from relay:'+JSON.stringify(data)});
        }
      },
      error: controlSignin.error
    });

  } else { // can read from url query string
    var requestedPermissionsString = decodeURIComponent(_urlParam('requestedPermissions',true));
    try {
      controlSignin.requestedPermissions = JSON.parse(requestedPermissionsString);
    } catch (e) {
      controlSignin.error({message: "Failed parsing requestedPermissionsURIEncoded", detail: "", id: "INTERNAL_ERROR"}); 
    };
    controlSignin.updateDisplay();
  }


  pryvConfig = {
      'LANGUAGE': controlSignin.uiLanguage,
      'REGISTER_URL': controlSignin.registerURL
  };  

  //-- validate view elements //
  controlSignin.usernameDisplay = $("#usernameDisplay");
  controlSignin.accessRequestDisplay =  $("#accessRequestDisplay");

  //-- signin view elements //
  controlSignin.userOrLogin = $("#loginUsernameOrEmail");
  controlSignin.password = $("#loginPassword");
  controlSignin.submitButton = $("#logginButton");
  controlSignin.loginUsernameOrEmailCheck = $("#loginUsernameOrEmailCheck");
  controlSignin.loginPasswordCheck = $("#loginPasswordCheck");

  if (controlSignin.password.length < 1) {
    console.log("DOM NOT READY");
    setTimeout("controlSignin.init()",500);
    return;
  }

  //--- constraints ---//
  controlSignin.usernameRegexp = /^([a-zA-Z0-9]{5,21})$/;
  controlSignin.emailRegexp = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

  // -- submit button
  controlSignin.submitButton.on('click',controlSignin.loginButtonPressed);
};


controlSignin.displayPage = function(id) {
  var pages = new Array('loadingPage','signinPage','validatePage');
  for(var i=0;i<pages.length;i++)
  {
    document.getElementById(pages[i]).style.visibility = pages[i] == id ? 'visible' : 'hidden';
  }
};



var STATE_LOADING_CHECK_APP_ACCESS = "STATE_LOADING_CHECK_APP_ACCESS";
var STATE_LOADING_LOGIN = "STATE_LOADING_CHECK_APP_ACCESS";

/**
 * control the state of the page.
 *  - what to display ?
 *  - need to be closed ?
 *  @param state
 *  @return 
 */
controlSignin.updateDisplay = function(state) {
  var state = state || false;
  if (state == STATE_LOADING_LOGIN) {
    return;
  }

  if (state == STATE_LOADING_CHECK_APP_ACCESS) {
    return controlSignin.displayPage('loadingPage');
  }

  if (controlSignin.token) {
    return controlSignin.close();
  }
  if (controlSignin.stateRefused) {
    return controlSignin.close();
  }

  if (controlSignin.sessionID && controlSignin.username && controlSignin.checkedPermissions) {
    controlSignin.usernameDisplay.html(controlSignin.username);
    controlSignin.accessRequestDisplay.val(JSON.stringify(controlSignin.checkedPermissions));
    return controlSignin.displayPage('validatePage');
  } 

  return controlSignin.displayPage('signinPage');
};

//-------------- binded to controls -----------------//

controlSignin.loginButtonPressed = function() {
  controlSignin.loginUsernameOrEmailCheck.html("");
  controlSignin.loginPasswordCheck.html("");
  if (controlSignin.password.val().length > 5) {
    if (controlSignin.usernameRegexp.test(controlSignin.userOrLogin.val())) {
      controlSignin.login(controlSignin.userOrLogin.val());
      return;
    } 
    if (controlSignin.emailRegexp.test(controlSignin.userOrLogin.val())) {
      controlSignin.loginWithEmail(controlSignin.userOrLogin.val());
      return;
    }
  }
  controlSignin.loginPasswordCheck.html(SIGNIN_MESSAGES['INVALID_PASSWORD']);
};

controlSignin.accessValidateButtonPressed = function() {
  if (controlSignin.mismatchingAccessToken) {
    controlSignin.deleteMissmatchingToken(controlSignin.postAccess);
  } else {
    controlSignin.postAccess();
  }
};

controlSignin.accessRefuseButtonPressed = function(code) {
  controlSignin.actionRefused('REFUSED_BY_USER','access refused by user');
};


//-------------- communication -------------------------//

controlSignin.sendState = function(stateJSON,callback,callbackError) {
  controlSignin.lastState = stateJSON;
  callback = callback || function() {};
  callbackError = callbackError || function() {};

  // -- if serverRelay is on -- //

  if (controlSignin.serverRelayIsOn) {
    console.log("ajax >> "+JSON.stringify(stateJSON));
    pryvAjaxCall({
      url: controlSignin.registerURL+'/access/'+controlSignin.key,
      type: 'POST',
      params: stateJSON,
      success: callback,
      error: callbackError
    });
  }

  //-- if url messaging is on-- //
  if (controlSignin.windowMessagingIsOn) {
    try { // try to communicate with opener in order to avoid polling
      console.log("window.opener >> "+JSON.stringify(stateJSON));
      window.opener.postMessage(stateJSON,"*");
    } catch (e) {console.log("Failed communicating with opener");};
  }
};



controlSignin.deleteMissmatchingToken = function(next) {

  pryvAjaxCall({
    url: 'https://'+controlSignin.username+'.'+controlSignin.domain+'/admin/accesses/'+controlSignin.mismatchingAccessToken,
    headers: {authorization: controlSignin.sessionID},
    type: 'DELETE',
    success: function(data,xhr) {
      console.log(xhr);
      if (xhr.status != 200) { // fail
        return controlSignin.error({message: "Failed deleting token", detail: xhr.statusText, id: "INTERNAL_ERROR", xhr: xhr});  
      }
      next();
    },
    error: controlSignin.error
  });
};


controlSignin.postAccess = function() {
  var params = {
      name:  controlSignin.requestingAppId,
      permissions: controlSignin.checkedPermissions,
      type: 'app'
  };

  pryvAjaxCall({
    url: 'https://'+controlSignin.username+'.'+controlSignin.domain+'/admin/accesses',
    headers: {authorization: controlSignin.sessionID},
    params: params,
    type: 'POST',
    success: function(data) {
      if (! data.token) { // fail
        return controlSignin.error({message: "Failed get-app-token", detail: "postAccess data: "+JSON.stringify(data), id: "INTERNAL_ERROR"}); 
      }

      controlSignin.success(data.token);
    },
    error: controlSignin.error
  });
};

/**
 * Called by checkAppAcess or postAccess
 */
controlSignin.success = function(token) {
  controlSignin.token = token;
  var newState = {status: 'ACCEPTED', 
              username: controlSignin.username, 
                 token: controlSignin.token,
                  lang: controlSignin.preferredLanguage};
  controlSignin.sendState(newState,controlSignin.updateDisplay);
};

controlSignin.actionRefused = function(reasonID,message) {
  controlSignin.stateRefused = true;
  controlSignin.sendState({status: 'REFUSED', reasonID: reasonID,  message: message}, controlSignin.updateDisplay);
};

/**
 * get email from register and proceed login(username)
 * @param email the email to translate
 */
controlSignin.loginWithEmail = function(email) {
  pryvAjaxCall({
    url: controlSignin.registerURL+'/'+email+'/uid',
    type: 'GET',
    success: function(data,xhr) {
      if (data.uid) {
        controlSignin.login(data.uid);
      } else if (data.id == 'UNKOWN_EMAIL') {
        controlSignin.loginUsernameOrEmailCheck.html(SIGNIN_MESSAGES['UNKOWN_EMAIL']);
      } else if (data.id) {
        controlSignin.error(jsonError);
      } else {
        controlSignin.error({message: "loginWithEmail invalid data", detail: JSON.stringify(data), id: "INTERNAL_ERROR"});
      }
    },
    error: controlSignin.error
  });
};



/**
 * Really do the signin.. 
 * This part may be moved to a relay server as soon as we enforce the check of "appId"
 * 
 * In fact this should be translated in one single /admin/get-token step with login/passwd
 * @param username
 */
controlSignin.login = function(username) {
  controlSignin.updateDisplay(STATE_LOADING_LOGIN);
  console.log("controlSignin.login "+username);
  var params = {
      username: username,
      password: controlSignin.password.val(),
      appId: 'pryv-web-access'
  };

  pryvAjaxCall({
    url: 'https://'+username+'.'+controlSignin.domain+'/admin/login',
    params: params,
    success: function(data) {
      if (data.sessionID) {
        controlSignin.sessionID = data.sessionID;
        controlSignin.username = username;
        controlSignin.preferredLanguage = data.preferredLanguage || controlSignin.preferredLanguage;
        controlSignin.checkAppAccess();
      } else if (data.id == 'INVALID_CREDENTIALS') {
        controlSignin.loginPasswordCheck.html(SIGNIN_MESSAGES['INVALID_CREDENTIALS']);
      } else {
        controlSignin.error({id: 'INTERNAL_ERROR', message: 'login() cannot find sessionID in response'});
      }
    },
    error: function(pryvError) {
      if (pryvError.xhr && pryvError.xhr.status == 0) {
        controlSignin.loginUsernameOrEmailCheck.html(SIGNIN_MESSAGES['UNKOWN_USERNAME']);
      } else {
        controlSignin.error(pryvError);
      }

    }
  });
};

/**
 * Once logged in check if user has access
 */
controlSignin.checkAppAccess = function() {
  controlSignin.updateDisplay(STATE_LOADING_CHECK_APP_ACCESS);
  console.log("controlSignin.checkAppAccess ");
  var params = {
      requestingAppId: controlSignin.requestingAppId,
      requestedPermissions: controlSignin.requestedPermissions
  };

  pryvAjaxCall({
    url: 'https://'+controlSignin.username+'.'+controlSignin.domain+'/admin/accesses/check-app',
    params: params,
    headers: {authorization: controlSignin.sessionID},
    success: function(data) {
      if (data.checkedPermissions) {
        controlSignin.checkedPermissions = data.checkedPermissions;
        controlSignin.mismatchingAccessToken =  data.mismatchingAccessToken || false;
        controlSignin.updateDisplay();
      } else if (data.matchingAccessToken) { // already accepted token
        controlSignin.success(data.matchingAccessToken);
      } else if (data.id) {
        controlSignin.error(data);
      } else {
        controlSignin.error({id: 'INTERNAL_ERROR', message: 'checkAppAccess() cannot find checkedPermissions in response'});
      }
    },
    error: controlSignin.error
  });
};


//------------- ERRORS -------------//

controlSignin.error = function(jsonError) {
  console.log("error:"+ JSON.stringify(jsonError));
  controlSignin.lastState = jsonError;
  if (controlSignin.key && (jsonError.id != 'INVALID_KEY')) {
    // transmit error to opener
    controlSignin.sendState(jsonError,null,function() {});
  } else {
    alert("ERROR: "+JSON.stringify(jsonError));
  }
  controlSignin.close();
};

//------------- CLOSE -------------//

controlSignin.close = function() {
  if (controlSignin.closing) return; 
  controlSignin.closing = true; 
  if (controlSignin.returnURL) {
    var nextURL = controlSignin.returnURL+"prYvkey="+controlSignin.key;
    var params = controlSignin.lastState;
    for (var key in params) {
      if (params.hasOwnProperty(key)) {
        nextURL += "&prYv"+key+"="+encodeURIComponent(params[key]);
      }
    }
    location.href = nextURL;
  } else {
    window.close();
  }
};
//------------------- end token grabbing ----------//


controlSignin.registrationDone = function(result) {
  alert("registrationDone "+JSON.stringify(result));
};


//-------------------- AJAX CALLS --------------------//

//TODO deal with errors
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
      };
      pack.success(result,xhr);
    };
  };
  for(var key in pack.headers){
    if (pack.headers.hasOwnProperty(key))
      xhr.setRequestHeader(key, pack.headers[key]);
  }
  xhr.withCredentials = true;
  try {
    xhr.send(JSON.stringify(pack.params));
  } catch (e) {
    pack.error({message: "pryvXHRCall unsent", detail: "", id: "INTERNAL_ERROR", error: e});
  };
  return xhr;
};


var pryvAjaxCall = pryvXHRCall;

/** util to grab parameters from url query string **/
var _urlParam = function(name,strict){
  var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
  if (! results || (! results[1])) {
    if (strict) { 
      controlSignin.error({message: "_urlParam invalid data", detail: "A system error occured, please retry later. (missing "+name+" param)", id: "INTERNAL_ERROR"}); 
    }  else { 
      return false; 
    }
  }
  return (results[1] == "false") ? false : results[1];
};




//get default language code
controlSignin._getPreferedLanguage = function (desiredLanguage) {
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

//--------------------- loader ---------------------//
$(document).ready(function() { $(window).bind('load', function() { 
  controlSignin.init(); 
//register controller Hook
  controlRegInit(function(result) { controlSignin.registrationDone(result); });
}); });


// TODO better window close detection 
/**
window.onbeforeunload=function(e) {
  if (controlSignin.closing) return; 
  controlSignin.actionRefused('WINDOW_CLOSED','login window closed by user');
};**/
