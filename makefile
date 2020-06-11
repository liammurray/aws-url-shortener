# -*- mode: Makefile -*-
#

.PHONY: \
	log-urls-func

# Should match name in dev deploy stage for build pipeline (buildPipelineStack.ts)
STACK_NAME=UrlShortener-dev
PACKAGE_OUTPUT_BUCKET?=nod15c.lambda
# Need export for sub-makes, i.e., $(MAKE)
export MAKETOOLS?=$(realpath ../maketools)
GEN_DIR=./generated

# To enable CDK for package/deploy of API:
#   export USE_CDK=true
#
ifeq ($(USE_CDK),true)
	# Use sam.mk to generate template using CDK commands
	CDK_INFRA_DIR?=./infra
	# The CDK stack (cdk list) to deploy
	CDK_DEPLOY_TARGET=urls-api-dev
endif

include $(MAKETOOLS)/sam.mk

# CDK creates weird logical names so we use stack output
# sam logs -n UrlFunction --stack-name $(STACK_NAME)

log-urls-func:
	$(eval ID=$(shell $(MAKETOOLS)/getStackOutputVal.sh $(STACK_NAME) UrlFuncId))
	sam logs -tn $(ID)


