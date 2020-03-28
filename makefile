# -*- mode: Makefile -*-
#

# Use GIT_TOKEN else GITHUB_PERSONAL_PACKAGE_TOKEN
GIT_TOKEN?=$(GITHUB_PERSONAL_PACKAGE_TOKEN)
GITHUB_OWNER=liammurray
STACK_NAME = urlShortener
PACKAGE_OUTPUT_BUCKET = nod15c.lambda

include ./buildlib/makefile-sam
