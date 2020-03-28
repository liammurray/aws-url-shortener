#!/usr/bin/env bash
set -e

STACK_NAME=$1
shift

CACHE=${BASH_SOURCE%/*}/.cf-outputs.json

# See swagger issues here:
#  https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-known-issues.html#api-gateway-known-issues-rest-apis

# Open API 3.0
TYPE=oas30

# Open API 2.0
# TYPE=swagger

# Output format
ACCEPT=application/yaml
OUTFOLDER=./generated
mkdir -p $OUTFOLDER

case $1 in
swagger)
  EXTENSIONS=
  OUT_FILE=$OUTFOLDER/$STACK_NAME-api.yml
  ;;
swagger-aws)
  EXTENSIONS="--parameters extensions='integrations'"
  OUT_FILE=$OUTFOLDER/$STACK_NAME-api-aws.yml
  ;;
postman)
  EXTENSIONS="--parameters extensions='postman'"
  OUT_FILE=$OUTFOLDER/$STACK_NAME-api-postman.yml
  ;;
*)
  echo >&2 "usage: ./get-swagger <stack-name> <swagger|postman>"
  exit 1
  ;;
esac

echo "Readout CFN stack output from $CACHE (make cache)..."
JSON=$(<$CACHE)

get() {
  local BLOB=$(jq -r ".$1.OutputValue" <<<$JSON 2>/dev/null)
  [ "${BLOB:-null}" == "null" ] && return 1
  echo $BLOB
}

API_ID=$(get ApiId)
STAGE=$(get ApiStage)

echo "Getting postman ($TYPE) for $API_ID:$STAGE"
set -x
# https://docs.aws.amazon.com/cli/latest/reference/apigateway/get-export.html
aws apigateway get-export \
  --rest-api-id $API_ID \
  --stage-name $STAGE \
  $EXTENSIONS \
  --export-type $TYPE \
  --accept $ACCEPT \
  $OUT_FILE

#
# API GW writes out:
#   url: https://dev-api.nod15c.com/{basePath}
#   basePath: /orders
#
# This fixes by removing the slash before the basePath variable in the URL
#
sed -i '' 's/\/{basePath}/{basePath}/g' ./$OUT_FILE
