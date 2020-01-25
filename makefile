# -*- mode: Makefile -*-
#

PACKAGE_OUTPUT_BUCKET = nod15c.lambda
STACK_NAME = $(shell basename $(CURDIR))
SAM_BUILD_OUTPUT_TEMPLATE = .packaged.yaml


# List of targets that are not files
.PHONY: \
	list \
	build-src \
	build-lambda \
	clean-projects \
	test \
	clean \
	build \
	api \
	validate \
	package \
	deploy \
	errors \
	output

SHELL=/usr/bin/env bash -o pipefail

# Locate makefiles under ./funcs
makefiles = $(shell export GLOBIGNORE="tools/:.*" ; echo ./funcs/*/makefile)
subdirs := $(foreach proj,$(makefiles),$(dir $(proj)))

list:
	@echo Stack name: $(STACK_NAME)
	@echo Subdirs: $(subdirs)
	@echo -------Targets-----------
	@(make -qp || true) | grep -v '^list$$' | awk -F':' '/^[a-zA-Z0-9][^$$#\/\t=]*:([^=]|$$)/ {split($$1,A,/ /);for(i in A)print A[i]}' | sort

build-src:
	@for dir in $(subdirs); do \
		$(MAKE) -C $$dir build; \
	 done

build-lambda:
	@for dir in $(subdirs); do \
		$(MAKE) -C $$dir lambda; \
	 done

build-layer:
	#$(MAKE) -C ./layer/nodejs build

clean-layer:
	#$(MAKE) -C ./layer/nodejs clean

clean-projects:
	@for dir in $(subdirs); do \
		$(MAKE) -C $$dir clean; \
	 done

test:
	@set -e; for dir in $(subdirs); do \
		cd $$dir; \
		npm run test; \
	 done

clean: clean-projects clean-layer
	@rm -rf .aws-sam
	@rm -f $$SAM_BUILD_OUTPUT_TEMPLATE


# Normally 'sam build' creates .aws-sam/build.
# We do building ourselves.
#
build: build-layer build-lambda

api:
	sam local start-api

validate:
	sam validate

# Not used since 'sam build' redudantly re-installs
# packages for each function from same directory.
#
# $(SAM_BUILD_OUTPUT_TEMPLATE): .aws-sam/build
# 	sam package \
# 		--output-template-file $(SAM_BUILD_OUTPUT_TEMPLATE) \
# 	  --s3-bucket $(PACKAGE_OUTPUT_BUCKET)
#

$(SAM_BUILD_OUTPUT_TEMPLATE): build
	sam package \
		--output-template-file $(SAM_BUILD_OUTPUT_TEMPLATE) \
	  --s3-bucket $(PACKAGE_OUTPUT_BUCKET)

package: $(SAM_BUILD_OUTPUT_TEMPLATE)


deploy: $(SAM_BUILD_OUTPUT_TEMPLATE)
	sam deploy \
		--template-file $(SAM_BUILD_OUTPUT_TEMPLATE) \
		--stack-name $(STACK_NAME) \
		--capabilities CAPABILITY_NAMED_IAM

# changeset: $(SAM_BUILD_OUTPUT_TEMPLATE)
# 	@aws cloudformation deploy \
# 		--no-execute-changeset \
# 		--template-file $(SAM_BUILD_OUTPUT_TEMPLATE) \
# 		--stack-name $(STACK_NAME) \
# 		--capabilities CAPABILITY_NAMED_IAM

output:
	@aws cloudformation describe-stacks \
		--stack-name $(STACK_NAME) \
		--query 'Stacks[].Outputs' \
		--output table

destroy:
	@aws cloudformation delete-stack \
			--stack-name $(STACK_NAME)

errors:
	@aws cloudformation describe-stack-events \
			--stack-name $(STACK_NAME) \
			| jq '.StackEvents[]|select(.ResourceStatus|index("FAILED"))'

outputs:
	@aws cloudformation describe-stacks \
			--stack-name $(STACK_NAME) \
			| jq '.Stacks[].Outputs'
