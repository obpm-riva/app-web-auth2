MOCHA=./node_modules/.bin/mocha

TEST_FILES=t

test:
	@$(MOCHA) --timeout 10000 --reporter spec test/*/*.js
	
test-ui: 
	@$(MOCHA) --timeout 10000 --reporter spec test/ui/*.js

test-libs: 
	@$(MOCHA) --timeout 10000 --reporter spec test/libs/*.js

.PHONY: test
