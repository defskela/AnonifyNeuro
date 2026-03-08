SHELL := /bin/bash

.PHONY: test test-watch test-unit test-integration test-e2e test-coverage

test:
	source ~/.nvm/nvm.sh && npm test -- --run

test-watch:
	source ~/.nvm/nvm.sh && npm run test:watch

test-unit:
	source ~/.nvm/nvm.sh && npm run test:unit

test-integration:
	source ~/.nvm/nvm.sh && npm run test:integration

test-e2e:
	source ~/.nvm/nvm.sh && npm run test:e2e

test-coverage:
	source ~/.nvm/nvm.sh && npm run test:coverage
