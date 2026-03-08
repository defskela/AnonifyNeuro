SHELL := /bin/bash

.PHONY: test test-unit test-integration test-e2e test-coverage

test:
	pytest -q

test-unit:
	pytest -q -m unit

test-integration:
	pytest -q -m integration

test-e2e:
	pytest -q -m e2e

test-coverage:
	pytest --cov=app --cov-report=term-missing -q
