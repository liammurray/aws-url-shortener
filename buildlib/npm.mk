# -*- mode: Makefile -*-
#
# Include file used to build projects with package.json
#
# Runs "npm run build" if any source file is out of date.
#

PATH := node_modules/.bin:$(PATH)

source_files := $(wildcard src/*.ts)
build_files := $(source_files:src/%.ts=dist/%.js)
# .package/<name>.tgz
PACKAGE := .package/$(shell node -p 'const p=require("./package.json"); `$${p.name}-$${p.version}.tgz`')

.PHONY: \
	build \
	package \
  clean \
  utest \
  develop \

build: dist

package: $(PACKAGE)

clean:
	npm run build:clean
	rm -f $(PACKAGE)

utest: node_modules
	npm run test

# For servers (express server, etc.)
develop: node_modules
	npm run start:watch | pino-pretty

node_modules: package.json
	npm i && touch node_modules

# For lambda functions
lambda: build
	npm run lambda

dist: $(source_files) node_modules tsconfig.json
	npm run build

$(PACKAGE): $(build_files)
	@mkdir -p "$(dir $@)"
	cd $(dir $@) && npm pack $(CURDIR)/dist

