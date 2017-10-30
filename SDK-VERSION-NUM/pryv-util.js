/* Initializing Pryv Namespace. */
/*jshint -W101*/
var Pryv = Pryv || {};

/**
 * Utily Belt for Pryv Application.
 * @module Utility
 * @namespace Pryv
 */
Pryv.Utility = {

  /* Regular expressions. */
  regex : {
    username :  /^([a-zA-Z0-9])(([a-zA-Z0-9\-]){3,21})([a-zA-Z0-9])$/,
    email : /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/
  },

  /**
   * Get API domain
   */
  apiDomain : function () {
    var domain = document.location.hostname.substr(document.location.hostname.indexOf('.') + 1);
    switch (domain) {
      case 'pryv.in':
        return 'pryv.li';
      case 'pryv.io':
        return 'pryv.me';
      case 'rec.la':
        return 'pryv.li';
    }
    return domain;
  },

  /**
   * Get Browser domain
   */
  browserDomain : function () {
    var domain = document.location.hostname.substr(document.location.hostname.indexOf('.') + 1);
    switch (domain) {
      case 'rec.la':
        return 'pryv.li';
    }
    return domain;
  },



  /**
   * Implements cross browser string endsWith
   * @return {Boolean}
   */
  endsWith : function(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  },

  /**
   *  return true if browser is seen as a mobile or tablet
   *  list grabbed from https://github.com/codefuze/js-mobile-tablet-redirect/blob/master/mobile-redirect.js
   */
  browserIsMobileOrTablet : function () {
    return (/iphone|ipod|android|blackberry|opera mini|opera mobi|skyfire|maemo|windows phone|palm|iemobile|symbian|symbianos|fennec|ipad|android 3|sch-i800|playbook|tablet|kindle|gt-p1000|sgh-t849|shw-m180s|a510|a511|a100|dell streak|silk/i.test(navigator.userAgent.toLowerCase()));
  },

  /**
   * Method to get the preffered language, either from desiredLanguage or from the browser settings
   * @method getPreferredLanguage
   * @supportedLanguages an array of supported languages encoded on 2characters
   * @desiredLanguage (optional) get this language if supported
   */
  getPreferredLanguage : function (supportedLanguages, desiredLanguage) {
    if (desiredLanguage) {
      if (supportedLanguages.indexOf(desiredLanguage) >= 0) return desiredLanguage;
    }
    var lct = null;
    if (navigator.language) {
      lct = navigator.language.toLowerCase().substring(0, 2);
    } else if (navigator.userLanguage) {
      lct = navigator.userLanguage.toLowerCase().substring(0, 2);
    } else if (navigator.userAgent.indexOf('[') != -1) {
      var start = navigator.userAgent.indexOf('[');
      var end = navigator.userAgent.indexOf(']');
      lct = navigator.userAgent.substring(start + 1, end).toLowerCase();
    }
    if (desiredLanguage) {
      if (lct.indexOf(desiredLanguage) >= 0) return lct;
    }

    return supportedLanguages[0];
  },


  /**
   * Method to check the browser supports CSS3.
   * @method supportCSS3
   * @access public
   * @return boolean
   */
  supportCSS3 : function()  {
    var stub = document.createElement('div'),
      browserImplementation = ['Webkit', 'Moz', 'O', 'Ms', 'Khtml'],
      testProperty = 'textShadow',
      browsersRegistered = browserImplementation.length;

    if (testProperty in stub.style) return true;

    testProperty = testProperty.replace(/^[a-z]/, function(val) {
      return val.toUpperCase();
    });

    while(browsersRegistered--) {
      if ( vendors[browsersRegistered] + testProperty in stub.style ) {
        return true;
      }
    }
    return false;
  },

  /**
   * Method to load external files like javascript and stylesheet. this version
   * of method only support to file types - js|javascript and css|stylesheet.
   * @method loadExternalFiles
   * @access public
   * @param string filename
   * @param string type
   */
  loadExternalFiles : function(filename, type)  {
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
  },

  /**
   * Get the content on an URL as a String ,
   * Mainly designed to load HTML ressources
   * @param url
   * @param callBack  function(error,content,xhr)
   * @return xhr request
   */
  getURLContent : function(url, callback) {
    var detail = 'Getting content of '+url;
    var xhr = this._initXHR();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 0) {
        callback({message: "pryvXHRCall unsent", detail: detail, id: "INTERNAL_ERROR", xhr: xhr},null);
      } else if (xhr.readyState == 4) {
        callback(null,xhr.responseText);
      }
    };
    //--- sending the request
    try {
      xhr.send();
    } catch (e) {
      callback({message: "pryvXHRCall unsent", detail: detail, id: "INTERNAL_ERROR", error: e}, null);
    };
    return xhr;
  },

  /**
   * Load the content of a URL into a div
   * !! No error will go to the console.
   */
  loadURLContentInElementId : function(url,elementId,next) {
    next = next || function() {} ;
    var content = document.getElementById(elementId);
    Pryv.Utility.getURLContent(url,
      function(error,result) {
        content.innerHTML = result;
        next();
        if (error) {
          console.error(error);
        } ;
      }
    );
  },



  /**
   * Method to handel the XMLHttpRequest.
   * @method XHR
   * @access public
   * @param object pack
   * @param info text to happend to error detail in case of failure
   */
  XHR : function (pack)  {
    var xhr = null;
    pack.info = pack.info || '';

    if(!pack.hasOwnProperty("async")) {
      pack.async = true;
    }

    // ------------ request TYPE
    pack.type = pack.type || 'POST';
    // method override test
    if (false && pack.type === 'DELETE') {
      pack.type = 'POST';
      pack.params =  pack.params || {};
      pack.params['_method'] = 'DELETE';
    }



    // ------------- request HEADERS


    pack.headers = pack.headers || {};

    if (pack.type === 'POST' || pack.type === 'PUT') {// add json headers is POST or PUT
      pack.headers['Content-Type'] =
        pack.headers['Content-Type'] || 'application/json; charset=utf-8';
    }

    if (pack.type === 'POST') { pack.params = pack.params || {}; }



    // -------------- error
    pack.error = pack.error || function (error, context) {
      throw new Error(JSON.stringify(error, function (key, value) {
        if (value === null) { return; }
        if (value === '') { return; }
        return value;
      }, 2));
    };

    var detail = pack.info + ', req: ' + pack.type + ' ' + pack.url;

    // --------------- request
    xhr = this._initXHR();

    xhr.open(pack.type, pack.url, pack.async);
    xhr.withCredentials = true;

    xhr.onerror = function(error) {
      pack.error({message: "pryvXHRCall unsent",
        detail: "XHR ONERROR", id: "INTERNAL_ERROR", xhr: xhr}, pack.context)
    };

    xhr.onreadystatechange = function () {
      detail += ' xhrstatus:' + xhr.statusText;
      if (xhr.readyState === 0) {
        pack.error({message: "pryvXHRCall unsent", detail: detail, id: "INTERNAL_ERROR", xhr: xhr}, pack.context);
      } else if (xhr.readyState === 4) {
        var result = null;

        if (xhr.responseText )  {
          try { result = JSON.parse(xhr.responseText); } catch (e) {
            return pack.error({message: "Data is not JSON", detail: xhr.responseText+"\n"+detail, id: "RESULT_NOT_JSON", xhr: xhr}, pack.context);
          }
        }

        pack.success(result,pack.context,xhr);
      }
    };

    for(var key in pack.headers){
      if (pack.headers.hasOwnProperty(key))
        xhr.setRequestHeader(key, pack.headers[key]);
    }

    //--- prepare the params
    var sentParams = null;
    if (pack.params)  {
      try {
        sentParams = JSON.stringify(pack.params)
      } catch (e) {
        return pack.error({message: "Parameters are not JSON", detail: "params: "+pack.params+"\n "+detail, id: "INTERNAL_ERROR", error: e}, pack.context);
      };
    }

    //--- sending the request
    try {
      xhr.send(sentParams);
    } catch (e) {
      return pack.error({message: "pryvXHRCall unsent", detail: detail, id: "INTERNAL_ERROR", error: e}, pack.context);
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

}


//----------- DomReady ----------//
/*!
 * domready (c) Dustin Diaz 2012 - License MIT
 */
/**
 !function (name, definition) {
  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
  else this[name] = definition()
}('domready', function (ready) {     **/

Pryv.Utility.domReady = function (ready) {


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
          console.log("on dom ready 2");
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
}();
