/* global module, require */

var $ = require('jquery');

/**
 * creates an object containing methods to handle front-end (prints, views) and data processing
 * @param page  {String}
 * @constructor Utility
 */
var UtilityConstructor = function (page) {
  this.genericError = '';
  this.$infoBlock = $('#infoBlock');
  this.$alertBlock = $('#alertBlock');
  this.$infoMessage = $('#infoMessage');
  this.$alertMessage = $('#alertMessage');
  this.$blockContainer = $('#blockContainer');
  this.url = formatURL($(location).attr('href'));

  switch(page) {
    case 'login':
      this.mainView = {
        $loginContainer: $('#loginContainer'),
        $loginFormRegister:  $('#loginFormRegister'),
        $loginFormReset: $('#loginFormReset')
      };
      break;
    case 'register':
      break;
    case 'reset-password':
      break;
  }
};

/* ----------- All pages ----------- */
/**
 * shows/hides main view (defined when Utility constructor is built)
 * @param state {String}
 */
UtilityConstructor.prototype.toggleMainView = function (state) {
  for (var key in this.mainView) {
    if (this.mainView.hasOwnProperty(key)) {
      switch(state) {
        case 'show':
          this.mainView[key].fadeIn(1000, 'linear');
          break;
        case 'hide':
          this.mainView[key].hide();
          break;
      }
    }
  }
};

/**
 * prints the state of the ongoing process into the console;
 * updates the 'infoBlock' element content
 * @param message {String}
 */
UtilityConstructor.prototype.printInfo = function (message) {
  console.log('[INFO]:', message);
  this.$blockContainer.show();
  this.$infoMessage.text(formatMessage(this.$infoBlock, message));
  this.blockState('show', 'info');
};

/**
 * prints an error message in the console;
 * updates the 'alertBlock' element content
 * @param error {String}
 */
UtilityConstructor.prototype.printError = function (error) {
  console.error('[ERROR]:', error);
  this.$blockContainer.show();
  if (typeof error === 'object') {
    displayMessageKey(this.$alertBlock, error, this.genericError);
  } else {
    this.$alertMessage.text(formatMessage(this.$alertBlock, error));
  }
  this.blockState('show', 'alert');
};

/**
 * shows/hides 'alertBlock' or 'infoBlock' elements
 * @param state {String}
 * @param block {String}
 */
UtilityConstructor.prototype.blockState = function (state, block) {
  switch(block) {
    case 'info':
      switch (state) {
        case 'show':
          this.$alertBlock.hide();
          this.$infoBlock.show();
          break;
        case 'hide':
          this.$infoBlock.hide();
          break;
      }
      break;
    case 'alert':
      switch (state) {
        case 'show':
          this.$infoBlock.hide();
          this.$alertBlock.show();
          break;
        case 'hide':
          this.$alertBlock.hide();
          break;
      }
      break;
  }
};

/* ----------- Access page ----------- */
/**
 * hides the main and the permissions views;
 * shows the loader view and displays login process success or failure
 * @param state   {String}
 * @param message {String | Object}
 */
UtilityConstructor.prototype.loaderView = function (state, message) {
  var $permissionsContainer = $('#permissionsContainer'),
    $loaderContainer = $('#loaderContainer'),
    $loaderMessage = $('#loaderMessage'),
    $loaderState = $('#loaderState');

  this.toggleMainView('hide');
  this.$blockContainer.hide();
  $permissionsContainer.hide();
  $loaderContainer.fadeIn(1000, 'linear');
  $loaderState.text(formatMessage($loaderContainer, state));
  if (typeof message === 'object') {
    displayMessageKey($loaderMessage, message, this.genericError);
  } else {
    $loaderMessage.text(formatMessage($loaderContainer, message));
  }
};

/**
 * hides the main view and shows the permissions view
 * @param Settings {Object}
 */
UtilityConstructor.prototype.permissionsView = function (Settings) {
  var $permissionsContainer = $('#permissionsContainer'),
    $permissionsRequestedBy = $('#permissionsRequestedBy');

  this.toggleMainView('hide');
  this.$blockContainer.hide();
  $permissionsContainer.fadeIn(1000, 'linear');
  $permissionsRequestedBy.html(Settings.strs.permissionsRequestedBy
    .replace('{appId}', Settings.access.requestingAppId));
};

/**
 * adds a permission and it's bottom-bar below the existing ones
 * @param Settings {Object}
 * @param data     {Object}
 */
UtilityConstructor.prototype.addPermission = function (Settings, data) {
  var $permissionsList = $('#permissionsList');

  var html = '';

  if (data.streamId === '*') {
    html = Settings.strs.permissionsAll;
  } else {
    html = data.name ? Settings.strs.permissionsUpdate
        .replace('{name}', data.name)
        .replace('{level}', data.level)
      : Settings.strs.permissionsCreate
        .replace('{name}', data.defaultName)
        .replace('{level}', data.level);
  }

  $(html.htmlTag('p', 'permissionElem')).hide().appendTo($permissionsList).fadeIn(1000);
  $(''.htmlTag('div', 'separator')).hide().appendTo($permissionsList).fadeIn(1000);
};

/**
 * allows/disable interactions with the 'Accept' and 'Reject' buttons on the permissions view
 * @param state {Boolean}
 */
UtilityConstructor.prototype.permissionsState = function (state) {
  var $permissionsAccept = $('#permissionsAccept'),
    $permissionsReject = $('#permissionsReject');

  $permissionsAccept.prop('disabled', state);
  $permissionsReject.prop('disabled', state);
};

module.exports = UtilityConstructor;



/**
 * gets the base url (without the parameters)
 * @param url   {String}
 * @returns     {String}
 */
function formatURL (url) {
  return url.split('?')[0];
}

/**
 * formats the message to fit in the $elem jQuery object
 * @param $elem   {Object}
 * @param message {String}
 * @returns       {String}
 */
function formatMessage ($elem, message){
  var width = $elem.innerWidth() - ($elem.outerWidth() - $elem.innerWidth()),
    newMessage = '';

  for (var i = 0; i < message.length; i++) {
    if (i > 0 && i % width === 0) {
      newMessage = newMessage.substring(0, i) + '\n' +
        newMessage.substring(i, newMessage.length);
    }
    newMessage += message[i];
  }
  return newMessage;
}

/**
 * searches for message key in object and applies it to the $elem jQuery object
 * if message key can't be found applies defaultMessage to the $elem jQuery object
 * @param $elem          {Object}
 * @param obj            {Object}
 * @param defaultMessage {String}
 */
function displayMessageKey ($elem, obj, defaultMessage) {
  var res = [];
  searchKeyInObject(obj, 'message', res);
  if (res.length > 0) {
    $elem.text(formatMessage($elem, res[0]));
  } else {
    $elem.text(formatMessage($elem, defaultMessage));
  }
}

/**
 * recursive to find a specific key value in nested object, results will be stored in the res array
 * @param obj   {Object}
 * @param query {String}
 * @param res   {Array}
 */
function searchKeyInObject (obj, query, res) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      var value = obj[key];
      if (value && typeof value === 'object') { searchKeyInObject(value, query, res); }
      if (key === query) { res.push(value); }
    }
  }
}

/**
 * formats a strings with the required HTML tag or/and class
 * @param tag       {String}
 * @param className {String}
 * @returns         {String}
 */
String.prototype.htmlTag = function (tag, className) {
  if (className) {
    return '<' + tag + ' class=\"' + className + '\">' + this + '</' + tag + '>';
  } else {
    return '<' + tag + '>' + this + '</' + tag + '>';
  }
};
