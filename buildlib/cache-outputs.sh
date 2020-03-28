#!/usr/bin/env bash
set -e

STACK_NAME=$1
CACHE=${BASH_SOURCE%/*}/.cf-outputs.json
echo "Looking up output for stack ($STACK_NAME)..."
json=$(aws cloudformation describe-stacks --stack-name $STACK_NAME | jq '.Stacks[].Outputs | map({(.OutputKey): .})|add')
echo "Saving output JSON to $CACHE"
echo "$json" >$CACHE
#cat $CACHE
