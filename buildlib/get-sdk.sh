#!/usr/bin/env bash
set -e

STACK_NAME=$1
shift

CACHE=${BASH_SOURCE%/*}/.cf-outputs.json

OUTFOLDER=./generated
mkdir -p $OUTFOLDER

echo "Readout CFN stack output from $CACHE (make cache)..."
JSON=$(<$CACHE)

get() {
  local BLOB=$(jq -r ".$1.OutputValue" <<<$JSON 2>/dev/null)
  [ "${BLOB:-null}" == "null" ] && return 1
  echo $BLOB
}

API_ID=$(get ApiId)
STAGE=$(get ApiStage)
TYPE=javascript
ZIPNAME=$OUTFOLDER/${STACK_NAME}-client-$TYPE-$STAGE.zip

echo "Getting skd ($TYPE) for $API_ID:$STAGE => $ZIPNAME"

aws apigateway get-sdk --rest-api-id $API_ID --stage-name $STAGE --sdk-type $TYPE $ZIPNAME
