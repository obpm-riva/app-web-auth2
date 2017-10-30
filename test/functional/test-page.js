var tests = require('../test-init.js');

// use zombie.js as headless browser
var Browser = require('zombie');
 
describe('test.html', function() {
  before(function() {
    this.browser = tests.newPatchedBrowser({ site: 'https://localhost:'+tests.config.get('http:port') });
    console.log( this.browser._xhr);
  });
 
  before(function(done) {
    this.browser.visit('/access/test.html',  {debug:true}, done);
  });
  
  it('sdk-loaded',function() {
    this.browser.evaluate("console.log('toto');");
  });
 
});