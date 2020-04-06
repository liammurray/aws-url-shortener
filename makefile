# -*- mode: Makefile -*-
#

.PHONY: \
	log-urls-func

# Should match name in ./stack directory
STACK_NAME = urls-api
PACKAGE_OUTPUT_BUCKET = nod15c.lambda
export MAKETOOLS=$(realpath ../maketools)
GEN_DIR=./generated
# Turns off commands that use SAM template commands
USE_CDK=true
include $(MAKETOOLS)/sam.mk

log-urls-func:
	$(eval ID=$(shell ./getOut.sh $(STACK_NAME) UrlFuncId))
	sam logs -tn $(ID)
